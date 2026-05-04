import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/auth.dto';
import { User } from '../users/users.entity';
import { MonitoringService } from '../monitoring/monitoring.service';
export declare class AuthService {
    private usersService;
    private sessionsService;
    private emailService;
    private monitoringService;
    constructor(usersService: UsersService, sessionsService: SessionsService, emailService: EmailService, monitoringService: MonitoringService);
    validateUser(email: string, password: string): Promise<User | null>;
    register(dto: RegisterDto): Promise<{
        message: string;
        userId: string;
    }>;
    login(user: User, meta: {
        ip?: string;
        userAgent?: string;
    }): Promise<{
        mfaRequired: boolean;
        mfaTempToken: string;
        sessionId?: undefined;
    } | {
        mfaRequired: boolean;
        sessionId: string;
        mfaTempToken?: undefined;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    enableMfa(userId: string): Promise<{
        secret: string;
        qrCode: string;
        message: string;
    }>;
    verifyMfa(userId: string, token: string): Promise<boolean>;
    completeMfaLogin(mfaTempToken: string, totpCode: string, meta: {
        ip?: string;
        userAgent?: string;
    }): Promise<{
        sessionId: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
}
