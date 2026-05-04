import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, ForgotPasswordDto, ResetPasswordDto, VerifyMfaDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
        userId: string;
    }>;
    login(req: Request, res: Response): Promise<{
        mfaRequired: boolean;
        mfaTempToken: string;
        message?: undefined;
        sessionId?: undefined;
    } | {
        message: string;
        sessionId: string;
        mfaRequired?: undefined;
        mfaTempToken?: undefined;
    }>;
    loginMfa(body: {
        mfaTempToken: string;
        totpCode: string;
    }, req: Request, res: Response): Promise<{
        message: string;
    }>;
    verifyEmail(token: string, res: Response): Promise<void>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    enableMfa(req: Request): Promise<{
        secret: string;
        qrCode: string;
        message: string;
    }>;
    verifyMfaCode(req: Request, dto: VerifyMfaDto): Promise<{
        valid: boolean;
        message: string;
    }>;
    logout(req: Request, res: Response): Promise<{
        message: string;
    }>;
}
