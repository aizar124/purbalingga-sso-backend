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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const sessions_service_1 = require("./sessions.service");
let SessionsController = class SessionsController {
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    async listSessions(req) {
        const user = req.user;
        const currentSessionId = req.cookies?.['sso_session'];
        const sessions = await this.sessionsService.listUserSessionOverview(user.id, currentSessionId);
        const lastActive = await this.sessionsService.getLastActive(user.id);
        const latestSession = sessions[0] || null;
        return {
            sessions,
            total: sessions.length,
            currentSessionId: currentSessionId || null,
            lastLoginAt: lastActive?.timestamp ? new Date(lastActive.timestamp).toISOString() : latestSession?.createdAt ? new Date(latestSession.createdAt).toISOString() : null,
            lastActiveAt: lastActive?.timestamp ? new Date(lastActive.timestamp).toISOString() : null,
            latestSessionId: latestSession?.sessionId || null,
        };
    }
    async revokeSession(sessionId, req, res) {
        const user = req.user;
        const session = await this.sessionsService.get(sessionId);
        if (!session || session.userId !== user.id) {
            throw new common_1.NotFoundException('Sesi tidak ditemukan');
        }
        await this.sessionsService.destroy(sessionId);
        if (req.cookies?.['sso_session'] === sessionId) {
            res.clearCookie('sso_session', { path: '/' });
        }
        return { message: 'Sesi berhasil diakhiri' };
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "revokeSession", null);
exports.SessionsController = SessionsController = __decorate([
    (0, common_1.Controller)('sessions'),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map