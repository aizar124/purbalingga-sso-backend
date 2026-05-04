"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const oauth_controller_1 = require("./oauth.controller");
const oauth_service_1 = require("./oauth.service");
const token_service_1 = require("./token.service");
const authorization_code_entity_1 = require("./authorization-code.entity");
const consent_entity_1 = require("./consent.entity");
const auth_module_1 = require("../auth/auth.module");
const users_module_1 = require("../users/users.module");
const clients_module_1 = require("../clients/clients.module");
let OAuthModule = class OAuthModule {
};
exports.OAuthModule = OAuthModule;
exports.OAuthModule = OAuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([authorization_code_entity_1.AuthorizationCode, consent_entity_1.Consent]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            clients_module_1.ClientsModule,
        ],
        controllers: [oauth_controller_1.OAuthController],
        providers: [oauth_service_1.OAuthService, token_service_1.TokenService],
        exports: [oauth_service_1.OAuthService, token_service_1.TokenService],
    })
], OAuthModule);
//# sourceMappingURL=oauth.module.js.map