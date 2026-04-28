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
        this.ACTIVE_USERS = 'active_users';
        this.LAST_ACTIVE = 'last_active:';
        this.SESSION_TTL_SEC = 60 * 60 * 24 * 7;
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
            pipeline.del(this.SESSION_PREFIX + sessionId);
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
    }
    async getRefreshToken(token) {
        const raw = await this.redis.get(`refresh:${token}`);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    async deleteRefreshToken(token) {
        await this.redis.del(`refresh:${token}`);
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