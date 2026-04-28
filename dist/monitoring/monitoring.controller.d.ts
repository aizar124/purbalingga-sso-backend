import { Request } from 'express';
import { MonitoringService } from './monitoring.service';
import { ActivityDto, DateRangeDto, LastActiveDto, ValidateTokenDto, UserListQueryDto } from './dto/monitoring.dto';
export declare class MonitoringController {
    private monitoringService;
    constructor(monitoringService: MonitoringService);
    validateToken(dto: ValidateTokenDto, req: Request): Promise<{
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
    activity(req: Request, dto: ActivityDto): Promise<{
        message: string;
    }>;
    lastActive(req: Request, dto: LastActiveDto): Promise<{
        message: string;
    }>;
    logins(query: DateRangeDto): Promise<{
        date: string;
        total: number;
        success: number;
        failed: number;
        items: {
            user: any;
            id: string;
            eventType: import("./monitoring-event.entity").MonitoringEventType;
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
    registers(query: DateRangeDto): Promise<{
        date: string;
        total: number;
        items: {
            user: any;
            id: string;
            eventType: import("./monitoring-event.entity").MonitoringEventType;
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
    users(query: UserListQueryDto): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    userDetail(id: string): Promise<any>;
    activeUsers(): Promise<{
        total: number;
        items: any[];
    }>;
    activeUsersDetail(): Promise<{
        total: number;
        items: any[];
    }>;
}
