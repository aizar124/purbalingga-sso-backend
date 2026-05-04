import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { MonitoringEvent, MonitoringEventType } from './monitoring-event.entity';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.entity';
type RequestMeta = {
    ip?: string;
    userAgent?: string;
};
export declare class MonitoringService {
    private monitoringRepo;
    private usersService;
    private sessionsService;
    private jwtService;
    constructor(monitoringRepo: Repository<MonitoringEvent>, usersService: UsersService, sessionsService: SessionsService, jwtService: JwtService);
    private stripUser;
    private normalizeDateRange;
    recordEvent(event: Partial<MonitoringEvent>): Promise<MonitoringEvent>;
    recordRegister(user: User, meta?: RequestMeta): Promise<void>;
    recordLoginSuccess(user: User, meta?: RequestMeta, extra?: Record<string, any>): Promise<void>;
    recordLoginFailure(email: string, meta?: RequestMeta, reason?: string): Promise<void>;
    recordTokenValidation(token: string, success: boolean, meta?: RequestMeta, details?: Record<string, any>): Promise<void>;
    recordActivity(userId: string, data: Record<string, any>, meta?: RequestMeta): Promise<void>;
    recordLastActive(userId: string, data?: Record<string, any>, meta?: RequestMeta): Promise<void>;
    validateToken(token: string, meta?: RequestMeta): Promise<{
        valid: boolean;
        claims: any;
        user: any;
        reason?: undefined;
    } | {
        valid: boolean;
        reason: string;
        claims?: undefined;
        user?: undefined;
    }>;
    getLoginReport(date?: string, limit?: number): Promise<{
        date: string;
        total: number;
        success: number;
        failed: number;
        items: {
            user: any;
            id: string;
            eventType: MonitoringEventType;
            actorUserId: string;
            subjectUserId: string;
            clientId: string;
            route: string;
            method: string;
            success: boolean;
            statusCode: number;
            ip: string;
            userAgent: string;
            metadata: Record<string, any>;
            createdAt: Date;
        }[];
    }>;
    getRegisterReport(date?: string, limit?: number): Promise<{
        date: string;
        total: number;
        items: {
            user: any;
            id: string;
            eventType: MonitoringEventType;
            actorUserId: string;
            subjectUserId: string;
            clientId: string;
            route: string;
            method: string;
            success: boolean;
            statusCode: number;
            ip: string;
            userAgent: string;
            metadata: Record<string, any>;
            createdAt: Date;
        }[];
    }>;
    listUsers(limit?: number, page?: number): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUserDetail(id: string): Promise<any>;
    listActiveUsers(detail?: boolean): Promise<{
        total: number;
        items: any[];
    }>;
}
export {};
