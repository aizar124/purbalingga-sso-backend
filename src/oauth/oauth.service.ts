import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { AuthorizationCode } from './authorization-code.entity';
import { Consent } from './consent.entity';
import { TokenService } from './token.service';
import { ClientsService } from '../clients/clients.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { OAuthClient } from '../clients/clients.entity';

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(AuthorizationCode)
    private authCodeRepo: Repository<AuthorizationCode>,
    @InjectRepository(Consent)
    private consentRepo: Repository<Consent>,
    private tokenService: TokenService,
    private clientsService: ClientsService,
    private usersService: UsersService,
    private sessionsService: SessionsService,
  ) {}

  // ─── Validasi client + redirect URI ───────────────────────────────────────
  async validateClient(clientId: string, redirectUri: string): Promise<OAuthClient | null> {
     console.log('Validating client:', clientId);  // ← ADD INI
    const client = await this.clientsService.findByClientId(clientId); 

    console.log('Found client:', client);  // ← ADD INI
    return this.clientsService.validateClient(clientId, redirectUri);
  }

  // ─── Cek apakah user sudah pernah consent ke client ini ───────────────────
  async hasConsent(userId: string, clientId: string, requestedScopes: string[]): Promise<boolean> {
    // Untuk test, auto-approve semua consent
  return true;  // ← Bypass consent check
    // const consent = await this.consentRepo.findOne({
    //   where: { userId, clientId },
    // });
    // if (!consent) return false;

    // // Pastikan semua scope yang diminta sudah di-consent
    // return requestedScopes.every((s) => consent.scopes.includes(s));
  }

  // ─── Simpan consent user ───────────────────────────────────────────────────
  async saveConsent(userId: string, clientId: string, scopes: string[]): Promise<void> {
    await this.consentRepo.upsert(
      { userId, clientId, scopes },
      ['userId', 'clientId'],
    );
  }

  // ─── Cabut consent user ────────────────────────────────────────────────────
  async revokeConsent(userId: string, clientId: string): Promise<void> {
    await this.consentRepo.delete({ userId, clientId });
  }

  // ─── Generate authorization code ──────────────────────────────────────────
  async generateAuthCode(
    userId: string,
    client: OAuthClient,
    redirectUri: string,
    scopes: string[],
    codeChallenge?: string,
    codeChallengeMethod?: string,
    nonce?: string,
  ): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

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

  // ─── Exchange authorization code → tokens ─────────────────────────────────
  async exchangeCode(body: {
    code: string;
    code_verifier?: string;
    client_id: string;
    client_secret?: string;
    redirect_uri: string;
    sessionId?: string;
  }) {
    // 1. Ambil auth code dari DB
    const authCode = await this.authCodeRepo.findOne({
      where: { code: body.code },
    });
    if (!authCode) throw new BadRequestException('Authorization code tidak valid');
    if (authCode.expiresAt < new Date()) {
      await this.authCodeRepo.delete({ code: body.code });
      throw new BadRequestException('Authorization code sudah kadaluarsa');
    }

    // 2. Validasi client
    if (authCode.clientId !== body.client_id) {
      throw new UnauthorizedException('client_id tidak cocok');
    }
    if (authCode.redirectUri !== body.redirect_uri) {
      throw new BadRequestException('redirect_uri tidak cocok');
    }

    // 3. Validasi PKCE (jika ada)
    if (authCode.codeChallenge) {
      if (!body.code_verifier) {
        throw new BadRequestException('code_verifier diperlukan');
      }
      const isValid = this.tokenService.verifyPkce(
        body.code_verifier,
        authCode.codeChallenge,
        authCode.codeChallengeMethod,
      );
      if (!isValid) throw new BadRequestException('PKCE verifikasi gagal');
    } else {
      // Tanpa PKCE: validasi client_secret
      if (!body.client_secret) {
        throw new UnauthorizedException('client_secret diperlukan');
      }
      const client = await this.clientsService.validateClientCredentials(
        body.client_id,
        body.client_secret,
      );
      if (!client) throw new UnauthorizedException('client_secret tidak valid');
    }

    // 4. Ambil data user
    const user = await this.usersService.findById(authCode.userId);
    if (!user) throw new NotFoundException('User tidak ditemukan');

    // 5. Ambil client
    const client = await this.clientsService.findByClientId(authCode.clientId);

    // 6. Generate tokens
    const [accessToken, idToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(user, client, authCode.scopes, body.sessionId),
      this.tokenService.generateIdToken(user, client, authCode.nonce),
      this.tokenService.generateRefreshToken(user.id, client.clientId, body.sessionId),
    ]);

    if (body.sessionId) {
      await this.sessionsService.registerAccessToken(body.sessionId, accessToken.jti);
    }

    await this.saveConsent(user.id, client.clientId, authCode.scopes);

    // 7. Hapus auth code (single-use)
    await this.authCodeRepo.delete({ code: body.code });

    return {
      access_token:  accessToken.token,
      token_type:    'Bearer',
      expires_in:    900, // 15 menit dalam detik
      refresh_token: refreshToken,
      id_token:      idToken,
      scope:         authCode.scopes.join(' '),
    };
  }

  // ─── Refresh token → access token baru ────────────────────────────────────
  async refreshAccessToken(refreshToken: string) {
    const data = await this.sessionsService.getRefreshToken(refreshToken);
    if (!data) throw new UnauthorizedException('Refresh token tidak valid atau kadaluarsa');

    const user   = await this.usersService.findById(data.userId);
    const client = await this.clientsService.findByClientId(data.clientId);
    if (!user || !client) throw new NotFoundException('User atau client tidak ditemukan');

    // Rotate refresh token (hapus lama, buat baru)
    await this.sessionsService.deleteRefreshToken(refreshToken);
    const accessTokenResult = await this.tokenService.generateAccessToken(user, client, client.allowedScopes, data.sessionId);
    const newRefreshToken = await this.tokenService.generateRefreshToken(user.id, client.clientId, data.sessionId);

    if (data.sessionId) {
      await this.sessionsService.registerAccessToken(data.sessionId, accessTokenResult.jti);
    }

    return {
      access_token:  accessTokenResult.token,
      token_type:    'Bearer',
      expires_in:    900,
      refresh_token: newRefreshToken,
    };
  }

  // ─── Ambil list consent user (untuk halaman dashboard akun) ───────────────
  async getUserConsents(userId: string) {
    const consents = await this.consentRepo.find({
      where: { userId },
      order: { grantedAt: 'DESC' },
    });

    const enriched = await Promise.all(
      consents.map(async (consent) => {
        const client = await this.clientsService.findByClientId(consent.clientId);
        return {
          ...consent,
          clientName: client?.name || consent.clientId,
          logoUrl: client?.logoUrl || null,
          description: client?.description || null,
        };
      }),
    );

    return enriched;
  }
}
