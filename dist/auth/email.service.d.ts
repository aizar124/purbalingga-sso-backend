export declare class EmailService {
    private readonly logger;
    private resend;
    private mailEnabled;
    constructor();
    private getSsoBaseUrl;
    private getFrontendUrl;
    sendVerificationEmail(email: string, token: string): Promise<void>;
    sendResetPasswordEmail(email: string, token: string): Promise<void>;
    private sendResendEmail;
    private formatResendError;
}
