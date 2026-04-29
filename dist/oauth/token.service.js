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
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const uuid_1 = require("uuid");
const crypto = require("crypto");
const sessions_service_1 = require("../sessions/sessions.service");
let TokenService = class TokenService {
    constructor(jwtService, sessionsService) {
        this.jwtService = jwtService;
        this.sessionsService = sessionsService;
    }
    async generateAccessToken(user, client, scopes) {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            scopes,
            client_id: client.clientId,
            iss: process.env.SSO_BASE_URL || 'http://41.216.191.39:4000',
            aud: client.clientId,
            jti: (0, uuid_1.v4)(),
        };
        return this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
        });
    }
    async generateIdToken(user, client, nonce) {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            picture: user.avatarUrl,
            role: user.role,
            nonce,
            iss: process.env.SSO_BASE_URL || 'http://41.216.191.39:4000',
            aud: client.clientId,
        };
        return this.jwtService.sign(payload, { expiresIn: '1h' });
    }
    async generateRefreshToken(userId, clientId) {
        const token = crypto.randomBytes(40).toString('hex');
        await this.sessionsService.saveRefreshToken(token, { userId, clientId });
        return token;
    }
    verifyPkce(codeVerifier, codeChallenge, method) {
        if (method === 'S256') {
            const hash = crypto
                .createHash('sha256')
                .update(codeVerifier)
                .digest('base64url');
            return hash === codeChallenge;
        }
        return codeVerifier === codeChallenge;
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        sessions_service_1.SessionsService])
], TokenService);
//# sourceMappingURL=token.service.js.map