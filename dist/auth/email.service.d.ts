export declare class EmailService {
    private transporter;
    private mailEnabled;
    constructor();
    sendVerificationEmail(email: string, token: string): Promise<void>;
    sendResetPasswordEmail(email: string, token: string): Promise<void>;
}
