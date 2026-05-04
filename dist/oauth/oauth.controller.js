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
exports.OAuthController = void 0;
const common_1 = require("@nestjs/common");
const oauth_service_1 = require("./oauth.service");
const sessions_service_1 = require("../sessions/sessions.service");
const clients_service_1 = require("../clients/clients.service");
const users_service_1 = require("../users/users.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const oauth_dto_1 = require("./dto/oauth.dto");
let OAuthController = class OAuthController {
    constructor(oauthService, sessionsService, clientsService, usersService) {
        this.oauthService = oauthService;
        this.sessionsService = sessionsService;
        this.clientsService = clientsService;
        this.usersService = usersService;
    }
    async authorize(query, req, res) {
        const { client_id, redirect_uri, scope = 'openid profile email', state, code_challenge, code_challenge_method, nonce, } = query;
        const client = await this.oauthService.validateClient(client_id, redirect_uri);
        if (!client) {
            return res.status(400).json({ error: 'invalid_client', error_description: 'Client tidak dikenali' });
        }
        const sessionId = req.cookies?.['sso_session'];
        const session = sessionId ? await this.sessionsService.get(sessionId) : null;
        if (!session) {
            const params = new URLSearchParams(query).toString();
            return res.redirect(`${process.env.FRONTEND_URL}/login?${params}`);
        }
        const scopes = scope.split(' ').filter(Boolean);
        const hasConsent = await this.oauthService.hasConsent(session.userId, client_id, scopes);
        if (!hasConsent) {
            const params = new URLSearchParams(query).toString();
            return res.redirect(`${process.env.FRONTEND_URL}/consent?${params}`);
        }
        const code = await this.oauthService.generateAuthCode(session.userId, client, redirect_uri, scopes, code_challenge, code_challenge_method, nonce);
        const callbackUrl = new URL(redirect_uri);
        callbackUrl.searchParams.set('code', code);
        if (state)
            callbackUrl.searchParams.set('state', state);
        return res.redirect(callbackUrl.toString());
    }
    async token(body, req) {
        if (body.grant_type === 'authorization_code') {
            return this.oauthService.exchangeCode({
                code: body.code,
                code_verifier: body.code_verifier,
                client_id: body.client_id,
                client_secret: body.client_secret,
                redirect_uri: body.redirect_uri,
                sessionId: req.cookies?.['sso_session'],
            });
        }
        if (body.grant_type === 'refresh_token') {
            return this.oauthService.refreshAccessToken(body.refresh_token);
        }
        return { error: 'unsupported_grant_type' };
    }
    async userInfo(req) {
        const user = await this.usersService.findById(req.user.id);
        const lastActive = await this.sessionsService.getLastActive(user.id);
        return {
            sub: user.id,
            email: user.email,
            name: user.name,
            picture: user.avatarUrl,
            avatarUrl: user.avatarUrl,
            role: user.role,
            username: user.username,
            birthDate: user.birthDate,
            phone: user.phone,
            city: user.city,
            bio: user.bio,
            gender: user.gender,
            lastLoginAt: lastActive?.timestamp ? new Date(lastActive.timestamp).toISOString() : null,
            lastActiveAt: lastActive?.timestamp ? new Date(lastActive.timestamp).toISOString() : null,
        };
    }
    async logout(req, res, redirectUri) {
        const sessionId = req.cookies?.['sso_session'];
        if (sessionId) {
            const session = await this.sessionsService.get(sessionId);
            if (session) {
                await this.sessionsService.destroyAll(session.userId);
            }
        }
        res.clearCookie('sso_session', { path: '/' });
        if (redirectUri) {
            return res.redirect(redirectUri);
        }
        return { message: 'Logout berhasil dari semua perangkat' };
    }
    async grantConsent(body, req, res) {
        const sessionId = req.cookies?.['sso_session'];
        const session = sessionId ? await this.sessionsService.get(sessionId) : null;
        if (!session) {
            return res.status(401).json({ error: 'Sesi tidak ditemukan. Silakan login ulang.' });
        }
        const client = await this.oauthService.validateClient(body.client_id, body.redirect_uri);
        if (!client) {
            return res.status(400).json({ error: 'Client tidak valid' });
        }
        const scopes = body.scope.split(' ').filter(Boolean);
        await this.oauthService.saveConsent(session.userId, body.client_id, scopes);
        const code = await this.oauthService.generateAuthCode(session.userId, client, body.redirect_uri, scopes, body.code_challenge, body.code_challenge_method, body.nonce);
        const callbackUrl = new URL(body.redirect_uri);
        callbackUrl.searchParams.set('code', code);
        if (body.state)
            callbackUrl.searchParams.set('state', body.state);
        return res.redirect(callbackUrl.toString());
    }
    async denyConsent(body) {
        const errorUrl = new URL(body.redirect_uri);
        errorUrl.searchParams.set('error', 'access_denied');
        if (body.state)
            errorUrl.searchParams.set('state', body.state);
        return { redirect: errorUrl.toString() };
    }
    async revokeConsent(clientId, req) {
        await this.oauthService.revokeConsent(req.user.id, clientId);
        return { message: 'Izin akses berhasil dicabut' };
    }
    async listConsents(req) {
        return this.oauthService.getUserConsents(req.user.id);
    }
    oidcDiscovery() {
        const base = process.env.SSO_BASE_URL || 'https://apisso.qode.my.id';
        return {
            issuer: base,
            authorization_endpoint: `${base}/oauth/authorize`,
            token_endpoint: `${base}/oauth/token`,
            userinfo_endpoint: `${base}/oauth/userinfo`,
            end_session_endpoint: `${base}/oauth/logout`,
            jwks_uri: `${base}/.well-known/jwks.json`,
            response_types_supported: ['code'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256'],
            scopes_supported: ['openid', 'profile', 'email'],
            token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
            claims_supported: ['sub', 'email', 'name', 'picture', 'role', 'username', 'birthDate', 'phone', 'city', 'bio', 'gender'],
            code_challenge_methods_supported: ['S256', 'plain'],
        };
    }
    jwks() {
        return {
            keys: [
                {
                    kty: 'RSA',
                    use: 'sig',
                    alg: 'RS256',
                    kid: 'purbalingga-sso-key-1',
                },
            ],
        };
    }
    async listSessions(req) {
        return this.sessionsService.listUserSessions(req.user.id);
    }
    async revokeSession(sessionId, req) {
        const session = await this.sessionsService.get(sessionId);
        if (!session || session.userId !== req.user.id) {
            return { error: 'Session tidak ditemukan' };
        }
        await this.sessionsService.destroy(sessionId);
        return { message: 'Session berhasil dihapus' };
    }
};
exports.OAuthController = OAuthController;
__decorate([
    (0, common_1.Get)('oauth/authorize'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [oauth_dto_1.AuthorizeDto, Object, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "authorize", null);
__decorate([
    (0, common_1.Post)('oauth/token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [oauth_dto_1.TokenDto, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "token", null);
__decorate([
    (0, common_1.Get)('oauth/userinfo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "userInfo", null);
__decorate([
    (0, common_1.Post)('oauth/logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Query)('post_logout_redirect_uri')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('consent/grant'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [oauth_dto_1.ConsentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "grantConsent", null);
__decorate([
    (0, common_1.Post)('consent/deny'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "denyConsent", null);
__decorate([
    (0, common_1.Delete)('consent/:clientId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('clientId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "revokeConsent", null);
__decorate([
    (0, common_1.Get)('consent'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "listConsents", null);
__decorate([
    (0, common_1.Get)('.well-known/openid-configuration'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OAuthController.prototype, "oidcDiscovery", null);
__decorate([
    (0, common_1.Get)('.well-known/jwks.json'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OAuthController.prototype, "jwks", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Delete)('sessions/:sessionId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "revokeSession", null);
exports.OAuthController = OAuthController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [oauth_service_1.OAuthService,
        sessions_service_1.SessionsService,
        clients_service_1.ClientsService,
        users_service_1.UsersService])
], OAuthController);
//# sourceMappingURL=oauth.controller.js.map