import { Request, Response } from 'express';
import { OAuthService } from './oauth.service';
import { SessionsService } from '../sessions/sessions.service';
import { ClientsService } from '../clients/clients.service';
import { UsersService } from '../users/users.service';
import { AuthorizeDto, TokenDto, ConsentDto } from './dto/oauth.dto';
export declare class OAuthController {
    private oauthService;
    private sessionsService;
    private clientsService;
    private usersService;
    constructor(oauthService: OAuthService, sessionsService: SessionsService, clientsService: ClientsService, usersService: UsersService);
    authorize(query: AuthorizeDto, req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    token(body: TokenDto): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token: string;
    } | {
        error: string;
    }>;
    userInfo(req: Request): Promise<{
        sub: string;
        email: string;
        name: string;
        picture: string;
        avatarUrl: string;
        role: import("../users/users.entity").UserRole;
        username: string;
        birthDate: string;
        phone: string;
        city: string;
        bio: string;
        gender: import("../users/users.entity").UserGender;
    }>;
    logout(req: Request, res: Response, redirectUri?: string): Promise<void | {
        message: string;
    }>;
    grantConsent(body: ConsentDto, req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    denyConsent(body: {
        redirect_uri: string;
        state?: string;
    }): Promise<{
        redirect: string;
    }>;
    revokeConsent(clientId: string, req: Request): Promise<{
        message: string;
    }>;
    listConsents(req: Request): Promise<import("./consent.entity").Consent[]>;
    oidcDiscovery(): {
        issuer: string;
        authorization_endpoint: string;
        token_endpoint: string;
        userinfo_endpoint: string;
        end_session_endpoint: string;
        jwks_uri: string;
        response_types_supported: string[];
        subject_types_supported: string[];
        id_token_signing_alg_values_supported: string[];
        scopes_supported: string[];
        token_endpoint_auth_methods_supported: string[];
        claims_supported: string[];
        code_challenge_methods_supported: string[];
    };
    jwks(): {
        keys: {
            kty: string;
            use: string;
            alg: string;
            kid: string;
        }[];
    };
    listSessions(req: Request): Promise<(import("../sessions/sessions.service").SsoSession & {
        sessionId: string;
    })[]>;
    revokeSession(sessionId: string, req: Request): Promise<{
        error: string;
        message?: undefined;
    } | {
        message: string;
        error?: undefined;
    }>;
}
