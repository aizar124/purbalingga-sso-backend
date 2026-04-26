import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { SessionsService } from '../sessions/sessions.service';
import { User } from '../users/users.entity';
import { OAuthClient } from '../clients/clients.entity';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private sessionsService: SessionsService,
  ) {}

  // ─── Access Token (JWT RS256, berlaku 15 menit) ───────────────────────────
  async generateAccessToken(
    user: User,
    client: OAuthClient,
    scopes: string[],
  ): Promise<string> {
    const payload = {
      sub:       user.id,
      email:     user.email,
      name:      user.name,
      role:      user.role,
      scopes,
      client_id: client.clientId,
      iss:       process.env.SSO_BASE_URL || 'http://localhost:4000',
      aud:       client.clientId,
      jti:       uuidv4(), // JWT ID unik, bisa dipakai untuk revocation
    };

    return this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });
  }

  // ─── ID Token (OIDC, berisi klaim identitas user) ─────────────────────────
  async generateIdToken(
    user: User,
    client: OAuthClient,
    nonce?: string,
  ): Promise<string> {
    const payload = {
      sub:     user.id,
      email:   user.email,
      name:    user.name,
      picture: user.avatarUrl,
      role:    user.role,
      nonce,
      iss:     process.env.SSO_BASE_URL || 'http://localhost:4000',
      aud:     client.clientId,
    };

    return this.jwtService.sign(payload, { expiresIn: '1h' });
  }

  // ─── Refresh Token (UUID random, disimpan di Redis) ───────────────────────
  async generateRefreshToken(userId: string, clientId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    await this.sessionsService.saveRefreshToken(token, { userId, clientId });
    return token;
  }

  // ─── Verifikasi PKCE code_verifier ────────────────────────────────────────
  verifyPkce(codeVerifier: string, codeChallenge: string, method: string): boolean {
    if (method === 'S256') {
      const hash = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
      return hash === codeChallenge;
    }
    // plain method (tidak direkomendasikan, tapi didukung)
    return codeVerifier === codeChallenge;
  }
}
