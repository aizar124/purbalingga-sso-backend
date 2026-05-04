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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const resend_1 = require("resend");
let EmailService = EmailService_1 = class EmailService {
    constructor() {
        this.logger = new common_1.Logger(EmailService_1.name);
        const apiKey = process.env.RESEND_API_KEY;
        this.mailEnabled = Boolean(apiKey);
        this.resend = apiKey ? new resend_1.Resend(apiKey) : null;
    }
    getSsoBaseUrl() {
        return process.env.SSO_BASE_URL || 'https://apisso.qode.my.id';
    }
    getFrontendUrl() {
        return process.env.FRONTEND_URL || 'https://sso.qode.my.id';
    }
    async sendVerificationEmail(email, token) {
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
    async sendResetPasswordEmail(email, token) {
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
    async sendResendEmail(params) {
        if (!this.mailEnabled || !this.resend) {
            this.logger.warn(`Resend belum dikonfigurasi, skip ${params.purpose} untuk ${params.email}`);
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
                this.logger.error(`Resend gagal kirim ${params.purpose} ke ${params.email}: ${errorMessage}`);
                throw new Error(errorMessage);
            }
            this.logger.log(`Resend berhasil kirim ${params.purpose} ke ${params.email}${data?.id ? ` (id: ${data.id})` : ''}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Resend error saat kirim ${params.purpose} ke ${params.email}: ${message}`);
            throw error instanceof Error
                ? error
                : new Error(`Gagal mengirim ${params.purpose} via Resend: ${message}`);
        }
    }
    formatResendError(error) {
        if (typeof error === 'string') {
            return error;
        }
        if (error instanceof Error) {
            return error.message;
        }
        try {
            return JSON.stringify(error);
        }
        catch {
            return 'Unknown Resend error';
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map