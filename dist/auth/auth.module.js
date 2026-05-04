"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const email_service_1 = require("./email.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const local_strategy_1 = require("./strategies/local.strategy");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const users_module_1 = require("../users/users.module");
const monitoring_module_1 = require("../monitoring/monitoring.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            monitoring_module_1.MonitoringModule,
            passport_1.PassportModule,
            jwt_1.JwtModule.register({
                privateKey: process.env.JWT_PRIVATE_KEY,
                publicKey: process.env.JWT_PUBLIC_KEY,
                signOptions: {
                    algorithm: 'RS256',
                    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
                },
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            email_service_1.EmailService,
            jwt_strategy_1.JwtStrategy,
            local_strategy_1.LocalStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            local_auth_guard_1.LocalAuthGuard,
            roles_guard_1.RolesGuard,
        ],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule, email_service_1.EmailService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map