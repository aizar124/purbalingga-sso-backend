"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const monitoring_controller_1 = require("./monitoring.controller");
const monitoring_service_1 = require("./monitoring.service");
const monitoring_event_entity_1 = require("./monitoring-event.entity");
const users_module_1 = require("../users/users.module");
const sessions_module_1 = require("../sessions/sessions.module");
let MonitoringModule = class MonitoringModule {
};
exports.MonitoringModule = MonitoringModule;
exports.MonitoringModule = MonitoringModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([monitoring_event_entity_1.MonitoringEvent]),
            users_module_1.UsersModule,
            sessions_module_1.SessionsModule,
            jwt_1.JwtModule.register({
                privateKey: process.env.JWT_PRIVATE_KEY,
                publicKey: process.env.JWT_PUBLIC_KEY,
                signOptions: {
                    algorithm: 'RS256',
                    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
                },
            }),
        ],
        controllers: [monitoring_controller_1.MonitoringController],
        providers: [monitoring_service_1.MonitoringService],
        exports: [monitoring_service_1.MonitoringService],
    })
], MonitoringModule);
//# sourceMappingURL=monitoring.module.js.map