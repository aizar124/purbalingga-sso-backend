import { Repository } from 'typeorm';
import { AuthorizationCode } from './authorization-code.entity';
import { Consent } from './consent.entity';
import { TokenService } from './token.service';
import { ClientsService } from '../clients/clients.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { OAuthClient } from '../clients/clients.entity';
export declare class OAuthService {
    private authCodeRepo;
    private consentRepo;
    private tokenService;
    private clientsService;
    private usersService;
    private sessionsService;
    constructor(authCodeRepo: Repository<AuthorizationCode>, consentRepo: Repository<Consent>, tokenService: TokenService, clientsService: ClientsService, usersService: UsersService, sessionsService: SessionsService);
    validateClient(clientId: string, redirectUri: string): Promise<OAuthClient | null>;
    hasConsent(userId: string, clientId: string, requestedScopes: string[]): Promise<boolean>;
    saveConsent(userId: string, clientId: string, scopes: string[]): Promise<void>;
    revokeConsent(userId: string, clientId: string): Promise<void>;
    generateAuthCode(userId: string, client: OAuthClient, redirectUri: string, scopes: string[], codeChallenge?: string, codeChallengeMethod?: string, nonce?: string): Promise<string>;
    exchangeCode(body: {
        code: string;
        code_verifier?: string;
        client_id: string;
        client_secret?: string;
        redirect_uri: string;
    }): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token: string;
        id_token: string;
        scope: string;
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token: string;
    }>;
    getUserConsents(userId: string): Promise<Consent[]>;
}
