"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const typeorm_2 = require("typeorm");
const monitoring_event_entity_1 = require("./monitoring-event.entity");
const sessions_service_1 = require("../sessions/sessions.service");
const users_service_1 = require("../users/users.service");
let MonitoringService = class MonitoringService {
    constructor(monitoringRepo, usersService, sessionsService, jwtService) {
        this.monitoringRepo = monitoringRepo;
        this.usersService = usersService;
        this.sessionsService = sessionsService;
        this.jwtService = jwtService;
    }
    stripUser(user) {
        if (!user)
            return null;
        const { password, mfaSecret, verifyToken, resetToken, ...safe } = user;
        return safe;
    }
    normalizeDateRange(date) {
        const base = date ? new Date(`${date}T00:00:00`) : new Date();
        if (Number.isNaN(base.getTime())) {
            throw new common_1.UnauthorizedException('Format tanggal tidak valid');
        }
        const start = new Date(base);
        start.setHours(0, 0, 0, 0);
        const end = new Date(base);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }
    async recordEvent(event) {
        const payload = this.monitoringRepo.create({
            success: true,
            ...event,
        });
        return this.monitoringRepo.save(payload);
    }
    async recordRegister(user, meta = {}) {
        await this.recordEvent({
            eventType: monitoring_event_entity_1.MonitoringEventType.REGISTER_SUCCESS,
            actorUserId: user.id,
            subjectUserId: user.id,
            route: '/auth/register',
            method: 'POST',
            ip: meta.ip,
            userAgent: meta.userAgent,
            metadata: {
                email: user.email,
                username: user.username,
            },
        });
    }
    async recordLoginSuccess(user, meta = {}, extra) {
        await this.recordEvent({
            eventType: monitoring_event_entity_1.MonitoringEventType.LOGIN_SUCCESS,
            actorUserId: user.id,
            subjectUserId: user.id,
            clientId: extra?.clientId,
            route: '/auth/login',
            method: 'POST',
            ip: meta.ip,
            userAgent: meta.userAgent,
            metadata: extra || {},
        });
    }
    async recordLoginFailure(email, meta = {}, reason) {
        await this.recordEvent({
            eventType: monitoring_event_entity_1.MonitoringEventType.LOGIN_FAILED,
            route: '/auth/login',
            method: 'POST',
            ip: meta.ip,
            userAgent: meta.userAgent,
            metadata: {
                email,
                reason,
            },
            success: false,
            statusCode: 401,
        });
    }
    async recordTokenValidation(token, success, meta = {}, details) {
        await this.recordEvent({
            eventType: monitoring_event_entity_1.MonitoringEventType.TOKEN_VALIDATE,
            success,
            route: '/api/validate-token',
            method: 'POST',
            ip: meta.ip,
            userAgent: meta.userAgent,
            metadata: {
                tokenPreview: token?.slice(0, 16),
                ...details,
            },
            statusCode: success ? 200 : 401,
        });
    }
    async recordActivity(userId, data, meta = {}) {
        await this.sessionsService.markLastActive(userId, Date.now(), {
            action: data.action,
            path: data.path,
            page: data.page,
            title: data.title,
            clientId: data.clientId,
            metadata: data.metadata || {},
        });
        await this.recordEvent({
            eventType: monitoring_event_entity_1.MonitoringEventType.ACTIVITY,
            actorUserId: userId,
            subjectUserId: userId,
            clientId: data.clientId,
            route: data.path || '/api/activity',
            method: 'POST',
            ip: meta.ip,
            userAgent: meta.userAgent,
            metadata: {
                action: data.action,
                page: data.page,
                title: data.title,
                metadata: data.metadata || {},
            },
        });
    }
    async recordLastActive(userId, data = {}, meta = {}) {
        await this.sessionsService.markLastActive(userId, Date.now(), {
            clientId: data.clientId,
            metadata: data.metadata || {},
        });
        await this.recordEvent({
            eventType: monitoring_event_entity_1.MonitoringEventType.LAST_ACTIVE,
            actorUserId: userId,
            subjectUserId: userId,
            clientId: data.clientId,
            route: '/api/last-active',
            method: 'POST',
            ip: meta.ip,
            userAgent: meta.userAgent,
            metadata: data.metadata || {},
        });
    }
    async validateToken(token, meta = {}) {
        try {
            const claims = await this.jwtService.verifyAsync(token, {
                publicKey: process.env.JWT_PUBLIC_KEY,
                algorithms: ['RS256'],
            });
            const user = await this.usersService.findById(claims.sub);
            const safeUser = user ? this.stripUser(user) : null;
            await this.recordTokenValidation(token, true, meta, {
                userId: claims.sub,
                email: claims.email,
                clientId: claims.client_id,
            });
            return {
                valid: true,
                claims,
                user: safeUser,
            };
        }
        catch (error) {
            await this.recordTokenValidation(token, false, meta, {
                reason: error?.message || 'invalid_token',
            });
            return {
                valid: false,
                reason: error?.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token',
            };
        }
    }
    async getLoginReport(date, limit = 20) {
        const { start, end } = this.normalizeDateRange(date);
        const [successCount, failedCount, events] = await Promise.all([
            this.monitoringRepo.count({
                where: {
                    eventType: monitoring_event_entity_1.MonitoringEventType.LOGIN_SUCCESS,
                    createdAt: (0, typeorm_2.Between)(start, end),
                },
            }),
            this.monitoringRepo.count({
                where: {
                    eventType: monitoring_event_entity_1.MonitoringEventType.LOGIN_FAILED,
                    createdAt: (0, typeorm_2.Between)(start, end),
                },
            }),
            this.monitoringRepo.find({
                where: {
                    eventType: (0, typeorm_2.In)([monitoring_event_entity_1.MonitoringEventType.LOGIN_SUCCESS, monitoring_event_entity_1.MonitoringEventType.LOGIN_FAILED]),
                    createdAt: (0, typeorm_2.Between)(start, end),
                },
                order: { createdAt: 'DESC' },
                take: limit,
            }),
        ]);
        const items = await Promise.all(events.map(async (event) => ({
            ...event,
            user: event.subjectUserId ? this.stripUser(await this.usersService.findById(event.subjectUserId)) : null,
        })));
        return {
            date: date || new Date().toISOString().slice(0, 10),
            total: successCount + failedCount,
            success: successCount,
            failed: failedCount,
            items,
        };
    }
    async getRegisterReport(date, limit = 20) {
        const { start, end } = this.normalizeDateRange(date);
        const [total, events] = await Promise.all([
            this.monitoringRepo.count({
                where: {
                    eventType: monitoring_event_entity_1.MonitoringEventType.REGISTER_SUCCESS,
                    createdAt: (0, typeorm_2.Between)(start, end),
                },
            }),
            this.monitoringRepo.find({
                where: {
                    eventType: monitoring_event_entity_1.MonitoringEventType.REGISTER_SUCCESS,
                    createdAt: (0, typeorm_2.Between)(start, end),
                },
                order: { createdAt: 'DESC' },
                take: limit,
            }),
        ]);
        const items = await Promise.all(events.map(async (event) => ({
            ...event,
            user: event.subjectUserId ? this.stripUser(await this.usersService.findById(event.subjectUserId)) : null,
        })));
        return {
            date: date || new Date().toISOString().slice(0, 10),
            total,
            items,
        };
    }
    async listUsers(limit = 100, page = 1) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.usersService.findManySafe(limit, skip),
            this.usersService.countUsers(),
        ]);
        await this.recordEvent({
            eventType: monitoring_event_entity_1.MonitoringEventType.USERS_LIST,
            route: '/api/users',
            method: 'GET',
            success: true,
            metadata: {
                limit,
                page,
            },
        });
        return {
            items: users,
            total,
            page,
            limit,
        };
    }
    async getUserDetail(id) {
        const user = await this.usersService.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User tidak ditemukan');
        await this.recordEvent({
            eventType: monitoring_event_entity_1.MonitoringEventType.USER_DETAIL,
            subjectUserId: id,
            route: `/api/users/${id}`,
            method: 'GET',
            success: true,
        });
        return this.stripUser(user);
    }
    async listActiveUsers(detail = false) {
        const activeUserIds = await this.sessionsService.listActiveUserIds();
        const uniqueIds = Array.from(new Set(activeUserIds));
        const items = [];
        for (const userId of uniqueIds) {
            const sessions = await this.sessionsService.listUserSessions(userId);
            if (!sessions.length) {
                await this.sessionsService.removeActiveUser(userId);
                continue;
            }
            const user = await this.usersService.findById(userId);
            if (!user)
                continue;
            const lastActive = await this.sessionsService.getLastActive(userId);
            items.push({
                ...this.stripUser(user),
                lastActive,
                sessionCount: sessions.length,
                sessions: detail ? sessions : undefined,
            });
        }
        await this.recordEvent({
            eventType: detail
                ? monitoring_event_entity_1.MonitoringEventType.ACTIVE_USERS_DETAIL
                : monitoring_event_entity_1.MonitoringEventType.ACTIVE_USERS_LIST,
            route: detail ? '/api/active-users/detail' : '/api/active-users',
            method: 'GET',
            success: true,
            metadata: {
                count: items.length,
            },
        });
        return {
            total: items.length,
            items,
        };
    }
};
exports.MonitoringService = MonitoringService;
exports.MonitoringService = MonitoringService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(monitoring_event_entity_1.MonitoringEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        sessions_service_1.SessionsService,
        jwt_1.JwtService])
], MonitoringService);
//# sourceMappingURL=monitoring.service.js.map