import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyMfaDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── POST /auth/register ───────────────────────────────────────────────────
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // max 5 register/menit
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ─── POST /auth/login ──────────────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // max 5 login gagal/menit
  @UseGuards(LocalAuthGuard) // LocalStrategy otomatis validasi email+password
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const meta = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.authService.login(req.user as any, meta);

    if (result.mfaRequired) {
      return { mfaRequired: true, mfaTempToken: result.mfaTempToken };
    }

    // Set SSO session sebagai HTTP-only cookie
    res.cookie('sso_session', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
      path: '/',
    });

    return { message: 'Login berhasil', sessionId: result.sessionId };
  }

  // ─── POST /auth/login/mfa ──────────────────────────────────────────────────
  @Post('login/mfa')
  @HttpCode(HttpStatus.OK)
  async loginMfa(
    @Body() body: { mfaTempToken: string; totpCode: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const result = await this.authService.completeMfaLogin(
      body.mfaTempToken,
      body.totpCode,
      meta,
    );

    res.cookie('sso_session', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { message: 'Login berhasil' };
  }

  // ─── GET /auth/verify-email?token=xxx ─────────────────────────────────────
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    await this.authService.verifyEmail(token);
    // Redirect ke halaman sukses di frontend SSO
    res.redirect(`${process.env.FRONTEND_URL}/verified`);
  }

  // ─── POST /auth/forgot-password ───────────────────────────────────────────
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // ─── POST /auth/reset-password ────────────────────────────────────────────
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ─── POST /auth/2fa/enable ────────────────────────────────────────────────
  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  async enableMfa(@Req() req: Request) {
    return this.authService.enableMfa((req.user as any).id);
  }

  // ─── POST /auth/2fa/verify ────────────────────────────────────────────────
  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  async verifyMfaCode(@Req() req: Request, @Body() dto: VerifyMfaDto) {
    const isValid = await this.authService.verifyMfa((req.user as any).id, dto.token);
    if (!isValid) return { valid: false, message: 'Kode tidak valid' };
    return { valid: true, message: 'MFA aktif' };
  }

  // ─── POST /auth/logout (hapus cookie) ─────────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.['sso_session'];
    if (sessionId) {
      // Import SessionsService tidak perlu karena sudah Global
      // Tapi di sini kita tangani di OAuthController /oauth/logout
    }
    res.clearCookie('sso_session', { path: '/' });
    return { message: 'Logout berhasil' };
  }
}
