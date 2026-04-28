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
exports.MonitoringController = void 0;
const common_1 = require("@nestjs/common");
const monitoring_service_1 = require("./monitoring.service");
const monitoring_dto_1 = require("./dto/monitoring.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let MonitoringController = class MonitoringController {
    constructor(monitoringService) {
        this.monitoringService = monitoringService;
    }
    async validateToken(dto, req) {
        return this.monitoringService.validateToken(dto.token, {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
    }
    async activity(req, dto) {
        const user = req.user;
        await this.monitoringService.recordActivity(user.id, dto, {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return { message: 'Activity tercatat' };
    }
    async lastActive(req, dto) {
        const user = req.user;
        await this.monitoringService.recordLastActive(user.id, dto, {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return { message: 'Last active diperbarui' };
    }
    async logins(query) {
        return this.monitoringService.getLoginReport(query.date, query.limit || 20);
    }
    async registers(query) {
        return this.monitoringService.getRegisterReport(query.date, query.limit || 20);
    }
    async users(query) {
        return this.monitoringService.listUsers(query.limit || 100, query.page || 1);
    }
    async userDetail(id) {
        return this.monitoringService.getUserDetail(id);
    }
    async activeUsers() {
        return this.monitoringService.listActiveUsers(false);
    }
    async activeUsersDetail() {
        return this.monitoringService.listActiveUsers(true);
    }
};
exports.MonitoringController = MonitoringController;
__decorate([
    (0, common_1.Post)('validate-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [monitoring_dto_1.ValidateTokenDto, Object]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "validateToken", null);
__decorate([
    (0, common_1.Post)('activity'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, monitoring_dto_1.ActivityDto]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "activity", null);
__decorate([
    (0, common_1.Post)('last-active'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, monitoring_dto_1.LastActiveDto]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "lastActive", null);
__decorate([
    (0, common_1.Get)('logins'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [monitoring_dto_1.DateRangeDto]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "logins", null);
__decorate([
    (0, common_1.Get)('registers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [monitoring_dto_1.DateRangeDto]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "registers", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [monitoring_dto_1.UserListQueryDto]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "users", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "userDetail", null);
__decorate([
    (0, common_1.Get)('active-users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "activeUsers", null);
__decorate([
    (0, common_1.Get)('active-users/detail'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "activeUsersDetail", null);
exports.MonitoringController = MonitoringController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [monitoring_service_1.MonitoringService])
], MonitoringController);
//# sourceMappingURL=monitoring.controller.js.map