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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let EmailService = class EmailService {
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
    async sendVerificationEmail(email, token) {
        if (!this.mailEnabled) {
            console.warn(`SMTP belum dikonfigurasi, skip verification email untuk ${email}`);
            return;
        }
        const verifyUrl = `${process.env.SSO_BASE_URL}/auth/verify-email?token=${token}`;
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
    async sendResetPasswordEmail(email, token) {
        if (!this.mailEnabled) {
            console.warn(`SMTP belum dikonfigurasi, skip reset email untuk ${email}`);
            return;
        }
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
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
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map