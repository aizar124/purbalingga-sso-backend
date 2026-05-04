import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null;
  private mailEnabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    this.mailEnabled = Boolean(apiKey);
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  private getSsoBaseUrl(): string {
    return process.env.SSO_BASE_URL || 'https://apisso.qode.my.id';
  }

  private getFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'https://sso.qode.my.id';
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.getSsoBaseUrl()}/auth/verify-email?token=${token}`;
    await this.sendResendEmail({
      email,
      purpose: 'verification email',
      subject: 'Verifikasi Email - Purbalingga Akun',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #102d4d; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Purbalingga Akun</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #102d4d;">Verifikasi Email Anda</h2>
            <p style="color: #64748b;">Klik tombol di bawah untuk mengaktifkan akun Anda:</p>
            <a href="${verifyUrl}"
               style="display: inline-block; background: #4072af; color: white; padding: 12px 28px;
                      border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
              Verifikasi Email
            </a>
            <p style="color: #64748b; font-size: 13px;">Link berlaku 24 jam. Jika Anda tidak mendaftar, abaikan email ini.</p>
          </div>
        </div>
      `,
    });
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.getFrontendUrl()}/reset-password?token=${token}`;
    await this.sendResendEmail({
      email,
      purpose: 'reset password email',
      subject: 'Reset Password - Purbalingga Akun',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #102d4d; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">Purbalingga Akun</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #102d4d;">Reset Password</h2>
            <p style="color: #64748b;">Kami menerima permintaan reset password untuk akun Anda:</p>
            <a href="${resetUrl}"
               style="display: inline-block; background: #4072af; color: white; padding: 12px 28px;
                      border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
              Reset Password
            </a>
            <p style="color: #64748b; font-size: 13px;">Link berlaku 1 jam.</p>
          </div>
        </div>
      `,
    });
  }

  private async sendResendEmail(params: {
    email: string;
    purpose: string;
    subject: string;
    html: string;
  }): Promise<void> {
    if (!this.mailEnabled || !this.resend) {
      this.logger.warn(
        `Resend belum dikonfigurasi, skip ${params.purpose} untuk ${params.email}`,
      );
      return;
    }

    const from = process.env.RESEND_FROM || 'Purbalingga Akun <noreply@purbalingga.id>';

    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to: params.email,
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        const errorMessage = this.formatResendError(error);
        this.logger.error(
          `Resend gagal kirim ${params.purpose} ke ${params.email}: ${errorMessage}`,
        );
        throw new Error(errorMessage);
      }

      this.logger.log(
        `Resend berhasil kirim ${params.purpose} ke ${params.email}${data?.id ? ` (id: ${data.id})` : ''}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Resend error saat kirim ${params.purpose} ke ${params.email}: ${message}`,
      );
      throw error instanceof Error
        ? error
        : new Error(`Gagal mengirim ${params.purpose} via Resend: ${message}`);
    }
  }

  private formatResendError(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown Resend error';
    }
  }
}
