"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const otplib_1 = require("otplib");
const qrcode = require("qrcode");
const uuid_1 = require("uuid");
const users_service_1 = require("../users/users.service");
const sessions_service_1 = require("../sessions/sessions.service");
const email_service_1 = require("./email.service");
const monitoring_service_1 = require("../monitoring/monitoring.service");
let AuthService = class AuthService {
    constructor(usersService, sessionsService, emailService, monitoringService) {
        this.usersService = usersService;
        this.sessionsService = sessionsService;
        this.emailService = emailService;
        this.monitoringService = monitoringService;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            return null;
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return null;
        return user;
    }
    async register(dto) {
        const hashed = await bcrypt.hash(dto.password, 12);
        const user = await this.usersService.create({
            ...dto,
            password: hashed,
        });
        await this.emailService.sendVerificationEmail(user.email, user.verifyToken);
        await this.monitoringService.recordRegister(user);
        return {
            message: 'Registrasi berhasil. Cek email Anda untuk verifikasi.',
            userId: user.id,
        };
    }
    async login(user, meta) {
        if (!user.isVerified) {
            throw new common_1.ForbiddenException('Email belum diverifikasi. Cek inbox Anda.');
        }
        if (user.mfaEnabled) {
            const mfaTempToken = (0, uuid_1.v4)();
            await this.sessionsService.saveAuthCode(`mfa_pending:${mfaTempToken}`, {
                userId: user.id,
                ...meta,
            });
            return { mfaRequired: true, mfaTempToken };
        }
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
    async verifyEmail(token) {
        const user = await this.usersService.verifyEmail(token);
        return { message: 'Email berhasil diverifikasi. Silakan login.' };
    }
    async enableMfa(userId) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User tidak ditemukan');
        const secret = otplib_1.authenticator.generateSecret();
        const otpAuthUrl = otplib_1.authenticator.keyuri(user.email, 'Purbalingga Akun', secret);
        const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);
        await this.usersService.updateMfaSecret(userId, secret);
        return {
            secret,
            qrCode: qrCodeDataUrl,
            message: 'Scan QR code dengan Google Authenticator / Authy',
        };
    }
    async verifyMfa(userId, token) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.mfaSecret)
            throw new common_1.BadRequestException('MFA tidak aktif');
        const isValid = otplib_1.authenticator.verify({ token, secret: user.mfaSecret });
        return isValid;
    }
    async completeMfaLogin(mfaTempToken, totpCode, meta) {
        const pending = await this.sessionsService.getAuthCode(`mfa_pending:${mfaTempToken}`);
        if (!pending)
            throw new common_1.UnauthorizedException('Token MFA tidak valid atau kadaluarsa');
        const user = await this.usersService.findById(pending.userId);
        const isValid = await this.verifyMfa(user.id, totpCode);
        if (!isValid)
            throw new common_1.UnauthorizedException('Kode TOTP tidak valid');
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
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            return { message: 'Jika email terdaftar, link reset akan dikirim.' };
        const token = (0, uuid_1.v4)();
        await this.usersService.setResetToken(user.id, token);
        await this.emailService.sendResetPasswordEmail(user.email, token);
        return { message: 'Jika email terdaftar, link reset akan dikirim.' };
    }
    async resetPassword(token, newPassword) {
        const user = await this.usersService.findByResetToken(token);
        if (!user)
            throw new common_1.BadRequestException('Token reset tidak valid');
        if (user.resetTokenExpiry < new Date()) {
            throw new common_1.BadRequestException('Token reset sudah kadaluarsa');
        }
        await this.usersService.updatePassword(user.id, newPassword);
        await this.sessionsService.destroyAll(user.id);
        return { message: 'Password berhasil direset. Silakan login kembali.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        sessions_service_1.SessionsService,
        email_service_1.EmailService,
        monitoring_service_1.MonitoringService])
], AuthService);
//# sourceMappingURL=auth.service.js.map