import { Request, Response } from 'express';
import { SessionsService } from './sessions.service';
export declare class SessionsController {
    private sessionsService;
    constructor(sessionsService: SessionsService);
    listSessions(req: Request): Promise<{
        sessions: import("./sessions.service").SessionOverview[];
        total: number;
        currentSessionId: any;
        lastLoginAt: string;
        lastActiveAt: string;
        latestSessionId: string;
    }>;
    revokeSession(sessionId: string, req: Request, res: Response): Promise<{
        message: string;
    }>;
}
