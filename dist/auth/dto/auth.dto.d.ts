export declare class RegisterDto {
    email: string;
    password: string;
    name?: string;
    username?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class VerifyMfaDto {
    token: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
