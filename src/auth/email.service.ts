import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private mailEnabled: boolean;

  constructor() {
    this.mailEnabled = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private getSsoBaseUrl(): string {
    return process.env.SSO_BASE_URL || 'https://apisso.qode.my.id';
  }

  private getFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'https://sso.qode.my.id';
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.mailEnabled) {
      console.warn(`SMTP belum dikonfigurasi, skip verification email untuk ${email}`);
      return;
    }

    const verifyUrl = `${this.getSsoBaseUrl()}/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@purbalingga.id',
      to: email,
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
    if (!this.mailEnabled) {
      console.warn(`SMTP belum dikonfigurasi, skip reset email untuk ${email}`);
      return;
    }

    const resetUrl = `${this.getFrontendUrl()}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@purbalingga.id',
      to: email,
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
}
