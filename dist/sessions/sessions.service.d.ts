import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export interface SsoSession {
    userId: string;
    email: string;
    role: string;
    createdAt: number;
    userAgent?: string;
    ip?: string;
}
export declare class SessionsService implements OnModuleInit, OnModuleDestroy {
    private redis;
    private readonly SESSION_PREFIX;
    private readonly USER_SESSIONS;
    private readonly ACTIVE_USERS;
    private readonly LAST_ACTIVE;
    private readonly SESSION_TTL_SEC;
    onModuleInit(): void;
    onModuleDestroy(): void;
    create(data: SsoSession): Promise<string>;
    get(sessionId: string): Promise<SsoSession | null>;
    destroy(sessionId: string): Promise<void>;
    destroyAll(userId: string): Promise<void>;
    listUserSessions(userId: string): Promise<(SsoSession & {
        sessionId: string;
    })[]>;
    listActiveUserIds(): Promise<string[]>;
    removeActiveUser(userId: string): Promise<void>;
    markLastActive(userId: string, timestamp?: number, details?: Record<string, any>): Promise<void>;
    getLastActive(userId: string): Promise<{
        timestamp: number;
        [key: string]: any;
    } | null>;
    saveRefreshToken(token: string, payload: {
        userId: string;
        clientId: string;
    }): Promise<void>;
    getRefreshToken(token: string): Promise<{
        userId: string;
        clientId: string;
    } | null>;
    deleteRefreshToken(token: string): Promise<void>;
    saveAuthCode(code: string, data: object): Promise<void>;
    getAuthCode(code: string): Promise<any | null>;
    deleteAuthCode(code: string): Promise<void>;
}
