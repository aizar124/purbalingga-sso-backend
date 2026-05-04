import { JwtService } from '@nestjs/jwt';
import { SessionsService } from '../sessions/sessions.service';
import { User } from '../users/users.entity';
import { OAuthClient } from '../clients/clients.entity';
export declare class TokenService {
    private jwtService;
    private sessionsService;
    constructor(jwtService: JwtService, sessionsService: SessionsService);
    generateAccessToken(user: User, client: OAuthClient, scopes: string[], sessionId?: string): Promise<{
        token: string;
        jti: string;
    }>;
    generateIdToken(user: User, client: OAuthClient, nonce?: string): Promise<string>;
    generateRefreshToken(userId: string, clientId: string, sessionId?: string): Promise<string>;
    verifyPkce(codeVerifier: string, codeChallenge: string, method: string): boolean;
}
