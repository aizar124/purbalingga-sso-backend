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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_local_1 = require("passport-local");
const auth_service_1 = require("../auth.service");
const monitoring_service_1 = require("../../monitoring/monitoring.service");
let LocalStrategy = class LocalStrategy extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy) {
    constructor(authService, monitoringService) {
        super({ usernameField: 'email', passReqToCallback: true });
        this.authService = authService;
        this.monitoringService = monitoringService;
    }
    async validate(req, email, password) {
        const user = await this.authService.validateUser(email, password);
        if (!user) {
            await this.monitoringService.recordLoginFailure(email, {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            }, 'invalid_credentials');
            throw new common_1.UnauthorizedException('Email atau password salah');
        }
        return user;
    }
};
exports.LocalStrategy = LocalStrategy;
exports.LocalStrategy = LocalStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        monitoring_service_1.MonitoringService])
], LocalStrategy);
//# sourceMappingURL=local.strategy.js.map