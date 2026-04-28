export declare class EmailService {
    private transporter;
    private mailEnabled;
    constructor();
    private getSsoBaseUrl;
    private getFrontendUrl;
    sendVerificationEmail(email: string, token: string): Promise<void>;
    sendResetPasswordEmail(email: string, token: string): Promise<void>;
}
