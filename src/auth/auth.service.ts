import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/auth.dto';
import { User } from '../users/users.entity';
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private emailService: EmailService,
    private monitoringService: MonitoringService,
  ) {}

  // ─── Validasi kredensial (dipakai LocalStrategy) ───────────────────────────
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;
    return user;
  }

  // ─── Register ──────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      ...dto,
      password: hashed,
    });

    // Kirim email verifikasi
    await this.emailService.sendVerificationEmail(user.email, user.verifyToken);
    await this.monitoringService.recordRegister(user);

    return {
      message: 'Registrasi berhasil. Cek email Anda untuk verifikasi.',
      userId: user.id,
    };
  }

  // ─── Login → buat SSO session ──────────────────────────────────────────────
  async login(user: User, meta: { ip?: string; userAgent?: string }) {
    if (!user.isVerified) {
      throw new ForbiddenException('Email belum diverifikasi. Cek inbox Anda.');
    }

    // Kalau MFA aktif, jangan buat session dulu — return flag mfaRequired
    if (user.mfaEnabled) {
      // Simpan temp token di Redis (5 menit) untuk step 2 MFA
      const mfaTempToken = uuidv4();
      await this.sessionsService.saveAuthCode(`mfa_pending:${mfaTempToken}`, {
        userId: user.id,
        ...meta,
      });
      return { mfaRequired: true, mfaTempToken };
    }

    // Buat SSO session (disimpan di Redis, dikirim via HTTP-only cookie)
    const sessionId = await this.sessionsService.create({
      userId: user.id,
      email: user.email,
      role: user.role,
      createdAt: Date.now(),
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    await this.monitoringService.recordLoginSuccess(user, meta);

    return { mfaRequired: false, sessionId };
  }

  // ─── Verifikasi email ──────────────────────────────────────────────────────
  async verifyEmail(token: string) {
    const user = await this.usersService.verifyEmail(token);
    return { message: 'Email berhasil diverifikasi. Silakan login.' };
  }

  // ─── MFA: Enable (generate secret + QR) ───────────────────────────────────
  async enableMfa(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(
      user.email,
      'Purbalingga Akun',
      secret,
    );
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    // Simpan secret sementara sebelum dikonfirmasi
    await this.usersService.updateMfaSecret(userId, secret);

    return {
      secret,
      qrCode: qrCodeDataUrl,
      message: 'Scan QR code dengan Google Authenticator / Authy',
    };
  }

  // ─── MFA: Verifikasi kode TOTP ─────────────────────────────────────────────
  async verifyMfa(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaSecret) throw new BadRequestException('MFA tidak aktif');

    const isValid = authenticator.verify({ token, secret: user.mfaSecret });
    return isValid;
  }

  // ─── MFA Login Step 2 ──────────────────────────────────────────────────────
  async completeMfaLogin(
    mfaTempToken: string,
    totpCode: string,
    meta: { ip?: string; userAgent?: string },
  ) {
    const pending = await this.sessionsService.getAuthCode(`mfa_pending:${mfaTempToken}`);
    if (!pending) throw new UnauthorizedException('Token MFA tidak valid atau kadaluarsa');

    const user = await this.usersService.findById(pending.userId);
    const isValid = await this.verifyMfa(user.id, totpCode);
    if (!isValid) throw new UnauthorizedException('Kode TOTP tidak valid');

    await this.sessionsService.deleteAuthCode(`mfa_pending:${mfaTempToken}`);

    const sessionId = await this.sessionsService.create({
      userId: user.id,
      email: user.email,
      role: user.role,
      createdAt: Date.now(),
      ...meta,
    });

    await this.monitoringService.recordLoginSuccess(user, meta, {
      mfa: true,
      clientId: undefined,
    });

    return { sessionId };
  }

  // ─── Forgot password ───────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    // Selalu return 200 meski email tidak ada (security)
    if (!user) return { message: 'Jika email terdaftar, link reset akan dikirim.' };

    const token = uuidv4();
    await this.usersService.setResetToken(user.id, token);
    await this.emailService.sendResetPasswordEmail(user.email, token);

    return { message: 'Jika email terdaftar, link reset akan dikirim.' };
  }

  // ─── Reset password ────────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user) throw new BadRequestException('Token reset tidak valid');
    if (user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Token reset sudah kadaluarsa');
    }

    await this.usersService.updatePassword(user.id, newPassword);
    // Invalidate semua session setelah reset password
    await this.sessionsService.destroyAll(user.id);

    return { message: 'Password berhasil direset. Silakan login kembali.' };
  }
}
