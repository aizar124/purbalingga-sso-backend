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
exports.OAuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = require("crypto");
const authorization_code_entity_1 = require("./authorization-code.entity");
const consent_entity_1 = require("./consent.entity");
const token_service_1 = require("./token.service");
const clients_service_1 = require("../clients/clients.service");
const users_service_1 = require("../users/users.service");
const sessions_service_1 = require("../sessions/sessions.service");
let OAuthService = class OAuthService {
    constructor(authCodeRepo, consentRepo, tokenService, clientsService, usersService, sessionsService) {
        this.authCodeRepo = authCodeRepo;
        this.consentRepo = consentRepo;
        this.tokenService = tokenService;
        this.clientsService = clientsService;
        this.usersService = usersService;
        this.sessionsService = sessionsService;
    }
    async validateClient(clientId, redirectUri) {
        console.log('Validating client:', clientId);
        const client = await this.clientsService.findByClientId(clientId);
        console.log('Found client:', client);
        return this.clientsService.validateClient(clientId, redirectUri);
    }
    async hasConsent(userId, clientId, requestedScopes) {
        return true;
    }
    async saveConsent(userId, clientId, scopes) {
        await this.consentRepo.upsert({ userId, clientId, scopes }, ['userId', 'clientId']);
    }
    async revokeConsent(userId, clientId) {
        await this.consentRepo.delete({ userId, clientId });
    }
    async generateAuthCode(userId, client, redirectUri, scopes, codeChallenge, codeChallengeMethod, nonce) {
        const code = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.authCodeRepo.save({
            code,
            userId,
            clientId: client.clientId,
            redirectUri,
            scopes,
            codeChallenge,
            codeChallengeMethod: codeChallengeMethod || 'S256',
            nonce,
            expiresAt,
        });
        return code;
    }
    async exchangeCode(body) {
        const authCode = await this.authCodeRepo.findOne({
            where: { code: body.code },
        });
        if (!authCode)
            throw new common_1.BadRequestException('Authorization code tidak valid');
        if (authCode.expiresAt < new Date()) {
            await this.authCodeRepo.delete({ code: body.code });
            throw new common_1.BadRequestException('Authorization code sudah kadaluarsa');
        }
        if (authCode.clientId !== body.client_id) {
            throw new common_1.UnauthorizedException('client_id tidak cocok');
        }
        if (authCode.redirectUri !== body.redirect_uri) {
            throw new common_1.BadRequestException('redirect_uri tidak cocok');
        }
        if (authCode.codeChallenge) {
            if (!body.code_verifier) {
                throw new common_1.BadRequestException('code_verifier diperlukan');
            }
            const isValid = this.tokenService.verifyPkce(body.code_verifier, authCode.codeChallenge, authCode.codeChallengeMethod);
            if (!isValid)
                throw new common_1.BadRequestException('PKCE verifikasi gagal');
        }
        else {
            if (!body.client_secret) {
                throw new common_1.UnauthorizedException('client_secret diperlukan');
            }
            const client = await this.clientsService.validateClientCredentials(body.client_id, body.client_secret);
            if (!client)
                throw new common_1.UnauthorizedException('client_secret tidak valid');
        }
        const user = await this.usersService.findById(authCode.userId);
        if (!user)
            throw new common_1.NotFoundException('User tidak ditemukan');
        const client = await this.clientsService.findByClientId(authCode.clientId);
        const [accessToken, idToken, refreshToken] = await Promise.all([
            this.tokenService.generateAccessToken(user, client, authCode.scopes),
            this.tokenService.generateIdToken(user, client, authCode.nonce),
            this.tokenService.generateRefreshToken(user.id, client.clientId),
        ]);
        await this.saveConsent(user.id, client.clientId, authCode.scopes);
        await this.authCodeRepo.delete({ code: body.code });
        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 900,
            refresh_token: refreshToken,
            id_token: idToken,
            scope: authCode.scopes.join(' '),
        };
    }
    async refreshAccessToken(refreshToken) {
        const data = await this.sessionsService.getRefreshToken(refreshToken);
        if (!data)
            throw new common_1.UnauthorizedException('Refresh token tidak valid atau kadaluarsa');
        const user = await this.usersService.findById(data.userId);
        const client = await this.clientsService.findByClientId(data.clientId);
        if (!user || !client)
            throw new common_1.NotFoundException('User atau client tidak ditemukan');
        await this.sessionsService.deleteRefreshToken(refreshToken);
        const newRefreshToken = await this.tokenService.generateRefreshToken(user.id, client.clientId);
        const accessToken = await this.tokenService.generateAccessToken(user, client, client.allowedScopes);
        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 900,
            refresh_token: newRefreshToken,
        };
    }
    async getUserConsents(userId) {
        const consents = await this.consentRepo.find({
            where: { userId },
            order: { grantedAt: 'DESC' },
        });
        const enriched = await Promise.all(consents.map(async (consent) => {
            const client = await this.clientsService.findByClientId(consent.clientId);
            return {
                ...consent,
                clientName: client?.name || consent.clientId,
                logoUrl: client?.logoUrl || null,
                description: client?.description || null,
            };
        }));
        return enriched;
    }
};
exports.OAuthService = OAuthService;
exports.OAuthService = OAuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(authorization_code_entity_1.AuthorizationCode)),
    __param(1, (0, typeorm_1.InjectRepository)(consent_entity_1.Consent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        token_service_1.TokenService,
        clients_service_1.ClientsService,
        users_service_1.UsersService,
        sessions_service_1.SessionsService])
], OAuthService);
//# sourceMappingURL=oauth.service.js.map