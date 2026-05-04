"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const uuid_1 = require("uuid");
let SessionsService = class SessionsService {
    constructor() {
        this.SESSION_PREFIX = 'sso_session:';
        this.USER_SESSIONS = 'user_sessions:';
        this.SESSION_TOKENS = 'session_tokens:';
        this.SESSION_REFRESH_TOKENS = 'session_refresh_tokens:';
        this.REVOKED_JTI = 'revoked_access_jti:';
        this.ACTIVE_USERS = 'active_users';
        this.LAST_ACTIVE = 'last_active:';
        this.SESSION_TTL_SEC = 60 * 60 * 24 * 7;
        this.REVOKED_TTL_SEC = 60 * 60 * 24;
    }
    onModuleInit() {
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });
        this.redis.on('connect', () => console.log('✅ Redis connected'));
        this.redis.on('error', (err) => console.error('❌ Redis error:', err));
    }
    onModuleDestroy() {
        this.redis.disconnect();
    }
    async create(data) {
        const sessionId = (0, uuid_1.v4)();
        const key = this.SESSION_PREFIX + sessionId;
        await this.redis.setex(key, this.SESSION_TTL_SEC, JSON.stringify(data));
        await this.redis.sadd(this.USER_SESSIONS + data.userId, sessionId);
        await this.redis.expire(this.USER_SESSIONS + data.userId, this.SESSION_TTL_SEC);
        await this.redis.sadd(this.ACTIVE_USERS, data.userId);
        await this.redis.expire(this.ACTIVE_USERS, this.SESSION_TTL_SEC);
        return sessionId;
    }
    async get(sessionId) {
        const raw = await this.redis.get(this.SESSION_PREFIX + sessionId);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    async destroy(sessionId) {
        const session = await this.get(sessionId);
        if (session) {
            await this.revokeSessionAccessTokens(sessionId);
            await this.revokeSessionRefreshTokens(sessionId);
            await this.redis.srem(this.USER_SESSIONS + session.userId, sessionId);
            const sessionIds = await this.redis.smembers(this.USER_SESSIONS + session.userId);
            if (sessionIds.length === 0) {
                await this.redis.srem(this.ACTIVE_USERS, session.userId);
            }
        }
        await this.redis.del(this.SESSION_PREFIX + sessionId);
    }
    async destroyAll(userId) {
        const sessionIds = await this.redis.smembers(this.USER_SESSIONS + userId);
        const pipeline = this.redis.pipeline();
        for (const sessionId of sessionIds) {
            await this.revokeSessionAccessTokens(sessionId);
            await this.revokeSessionRefreshTokens(sessionId);
            pipeline.del(this.SESSION_PREFIX + sessionId);
            pipeline.del(this.SESSION_TOKENS + sessionId);
            pipeline.del(this.SESSION_REFRESH_TOKENS + sessionId);
        }
        pipeline.del(this.USER_SESSIONS + userId);
        pipeline.srem(this.ACTIVE_USERS, userId);
        await pipeline.exec();
    }
    async listUserSessions(userId) {
        const sessionIds = await this.redis.smembers(this.USER_SESSIONS + userId);
        const sessions = [];
        for (const sessionId of sessionIds) {
            const data = await this.get(sessionId);
            if (data)
                sessions.push({ ...data, sessionId });
        }
        return sessions;
    }
    describeUserAgent(userAgent) {
        const ua = userAgent || '';
        const browser = ua.includes('Chrome')
            ? 'Chrome'
            : ua.includes('Firefox')
                ? 'Firefox'
                : ua.includes('Safari') && !ua.includes('Chrome')
                    ? 'Safari'
                    : ua.includes('Edg')
                        ? 'Edge'
                        : 'Browser tidak dikenali';
        const platform = ua.includes('Windows')
            ? 'Windows'
            : ua.includes('Mac OS') || ua.includes('Macintosh')
                ? 'macOS'
                : ua.includes('Android')
                    ? 'Android'
                    : ua.includes('iPhone') || ua.includes('iPad')
                        ? 'iOS'
                        : ua.includes('Linux')
                            ? 'Linux'
                            : 'Platform tidak dikenali';
        return {
            browser,
            platform,
            deviceName: `${browser} on ${platform}`,
        };
    }
    async listUserSessionOverview(userId, currentSessionId) {
        const sessionIds = await this.redis.smembers(this.USER_SESSIONS + userId);
        const lastActive = await this.getLastActive(userId);
        const sessions = await Promise.all(sessionIds.map(async (sessionId) => {
            const data = await this.get(sessionId);
            if (!data)
                return null;
            const device = this.describeUserAgent(data.userAgent);
            return {
                ...data,
                sessionId,
                isCurrent: currentSessionId ? sessionId === currentSessionId : false,
                deviceName: device.deviceName,
                browser: device.browser,
                platform: device.platform,
                location: data.ip ? `IP ${data.ip}` : undefined,
                lastActiveAt: lastActive?.timestamp,
            };
        }));
        return sessions
            .filter(Boolean)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    async registerAccessToken(sessionId, jti) {
        await this.redis.sadd(this.SESSION_TOKENS + sessionId, jti);
        await this.redis.expire(this.SESSION_TOKENS + sessionId, this.SESSION_TTL_SEC);
    }
    async revokeAccessToken(jti) {
        await this.redis.setex(this.REVOKED_JTI + jti, this.REVOKED_TTL_SEC, '1');
    }
    async isAccessTokenRevoked(jti) {
        if (!jti) {
            return true;
        }
        return Boolean(await this.redis.get(this.REVOKED_JTI + jti));
    }
    async revokeSessionAccessTokens(sessionId) {
        const jtis = await this.redis.smembers(this.SESSION_TOKENS + sessionId);
        if (jtis.length > 0) {
            for (const jti of jtis) {
                await this.revokeAccessToken(jti);
            }
        }
        await this.redis.del(this.SESSION_TOKENS + sessionId);
    }
    async listActiveUserIds() {
        return this.redis.smembers(this.ACTIVE_USERS);
    }
    async removeActiveUser(userId) {
        await this.redis.srem(this.ACTIVE_USERS, userId);
    }
    async markLastActive(userId, timestamp = Date.now(), details = {}) {
        await this.redis.set(this.LAST_ACTIVE + userId, JSON.stringify({
            timestamp,
            ...details,
        }), 'EX', this.SESSION_TTL_SEC);
        await this.redis.sadd(this.ACTIVE_USERS, userId);
        await this.redis.expire(this.ACTIVE_USERS, this.SESSION_TTL_SEC);
    }
    async getLastActive(userId) {
        const raw = await this.redis.get(this.LAST_ACTIVE + userId);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    async saveRefreshToken(token, payload) {
        const ttl = 60 * 60 * 24 * 30;
        await this.redis.setex(`refresh:${token}`, ttl, JSON.stringify(payload));
        if (payload.sessionId) {
            await this.registerRefreshToken(payload.sessionId, token);
        }
    }
    async getRefreshToken(token) {
        const raw = await this.redis.get(`refresh:${token}`);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    async deleteRefreshToken(token) {
        const payload = await this.getRefreshToken(token);
        if (payload?.sessionId) {
            await this.redis.srem(this.SESSION_REFRESH_TOKENS + payload.sessionId, token);
        }
        await this.redis.del(`refresh:${token}`);
    }
    async registerRefreshToken(sessionId, token) {
        await this.redis.sadd(this.SESSION_REFRESH_TOKENS + sessionId, token);
        await this.redis.expire(this.SESSION_REFRESH_TOKENS + sessionId, this.SESSION_TTL_SEC);
    }
    async revokeSessionRefreshTokens(sessionId) {
        const tokens = await this.redis.smembers(this.SESSION_REFRESH_TOKENS + sessionId);
        if (tokens.length > 0) {
            for (const token of tokens) {
                await this.redis.del(`refresh:${token}`);
            }
        }
        await this.redis.del(this.SESSION_REFRESH_TOKENS + sessionId);
    }
    async saveAuthCode(code, data) {
        await this.redis.setex(`auth_code:${code}`, 600, JSON.stringify(data));
    }
    async getAuthCode(code) {
        const raw = await this.redis.get(`auth_code:${code}`);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    async deleteAuthCode(code) {
        await this.redis.del(`auth_code:${code}`);
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)()
], SessionsService);
//# sourceMappingURL=sessions.service.js.map