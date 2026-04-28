"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const oauth_module_1 = require("./oauth/oauth.module");
const users_module_1 = require("./users/users.module");
const clients_module_1 = require("./clients/clients.module");
const sessions_module_1 = require("./sessions/sessions.module");
const users_entity_1 = require("./users/users.entity");
const clients_entity_1 = require("./clients/clients.entity");
const authorization_code_entity_1 = require("./oauth/authorization-code.entity");
const consent_entity_1 = require("./oauth/consent.entity");
const monitoring_event_entity_1 = require("./monitoring/monitoring-event.entity");
const DEFAULT_DB_HOST = 'localhost';
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.DB_HOST || DEFAULT_DB_HOST,
                port: parseInt(process.env.DB_PORT) || 3306,
                username: process.env.DB_USER || 'root',
                password: process.env.DB_PASS || '',
                database: process.env.DB_NAME || 'purbalingga_sso',
                entities: [users_entity_1.User, clients_entity_1.OAuthClient, authorization_code_entity_1.AuthorizationCode, consent_entity_1.Consent, monitoring_event_entity_1.MonitoringEvent],
                synchronize: process.env.NODE_ENV !== 'production',
                logging: process.env.NODE_ENV === 'development',
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'short',
                    ttl: 1000,
                    limit: 10,
                },
                {
                    name: 'medium',
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            auth_module_1.AuthModule,
            oauth_module_1.OAuthModule,
            users_module_1.UsersModule,
            clients_module_1.ClientsModule,
            sessions_module_1.SessionsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map