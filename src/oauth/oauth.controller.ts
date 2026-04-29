import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OAuthService } from './oauth.service';
import { SessionsService } from '../sessions/sessions.service';
import { ClientsService } from '../clients/clients.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorizeDto, TokenDto, ConsentDto } from './dto/oauth.dto';

@Controller()
export class OAuthController {
  constructor(
    private oauthService: OAuthService,
    private sessionsService: SessionsService,
    private clientsService: ClientsService,
    private usersService: UsersService,
  ) {}

  // ─── GET /oauth/authorize ──────────────────────────────────────────────────
  // Entry point OAuth2 flow. Dipanggil oleh browser user.
  @Get('oauth/authorize')
  async authorize(
    @Query() query: AuthorizeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const {
      client_id, redirect_uri, scope = 'openid profile email',
      state, code_challenge, code_challenge_method, nonce,
    } = query;

    // 1. Validasi client dan redirect URI
    const client = await this.oauthService.validateClient(client_id, redirect_uri);
    if (!client) {
      return res.status(400).json({ error: 'invalid_client', error_description: 'Client tidak dikenali' });
    }

    // 2. Cek SSO session via cookie
    const sessionId = req.cookies?.['sso_session'];
    const session   = sessionId ? await this.sessionsService.get(sessionId) : null;

    // 3. Belum login → redirect ke halaman login SSO
    if (!session) {
      const params = new URLSearchParams(query as any).toString();
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?${params}`,
      );
    }

    const scopes = scope.split(' ').filter(Boolean);

    // 4. Cek consent — belum pernah consent → tampilkan consent screen
    const hasConsent = await this.oauthService.hasConsent(session.userId, client_id, scopes);
    if (!hasConsent) {
      const params = new URLSearchParams(query as any).toString();
      return res.redirect(
        `${process.env.FRONTEND_URL}/consent?${params}`,
      );
    }

    // 5. Sudah consent → langsung generate auth code dan redirect
    const code = await this.oauthService.generateAuthCode(
      session.userId,
      client,
      redirect_uri,
      scopes,
      code_challenge,
      code_challenge_method,
      nonce,
    );

    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set('code', code);
    if (state) callbackUrl.searchParams.set('state', state);

    return res.redirect(callbackUrl.toString());
  }

  // ─── POST /oauth/token ─────────────────────────────────────────────────────
  // Exchange authorization code → access token (dipanggil server-side client)
  @Post('oauth/token')
  @HttpCode(HttpStatus.OK)
  async token(@Body() body: TokenDto) {
    if (body.grant_type === 'authorization_code') {
      return this.oauthService.exchangeCode({
        code:          body.code,
        code_verifier: body.code_verifier,
        client_id:     body.client_id,
        client_secret: body.client_secret,
        redirect_uri:  body.redirect_uri,
      });
    }

    if (body.grant_type === 'refresh_token') {
      return this.oauthService.refreshAccessToken(body.refresh_token);
    }

    return { error: 'unsupported_grant_type' };
  }

  // ─── GET /oauth/userinfo ───────────────────────────────────────────────────
  // OIDC userinfo endpoint — return klaim user dari access token
  @Get('oauth/userinfo')
  @UseGuards(JwtAuthGuard)
  async userInfo(@Req() req: Request) {
    const user = await this.usersService.findById((req.user as any).id);
    return {
      sub:       user.id,
      email:     user.email,
      name:      user.name,
      picture:   user.avatarUrl,
      avatarUrl: user.avatarUrl,
      role:      user.role,
      username:  user.username,
      birthDate: user.birthDate,
      phone:     user.phone,
      city:      user.city,
      bio:       user.bio,
      gender:    user.gender,
    };
  }

  // ─── POST /oauth/logout ────────────────────────────────────────────────────
  // Global logout — hapus semua session user di Redis
  @Post('oauth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query('post_logout_redirect_uri') redirectUri?: string,
  ) {
    const sessionId = req.cookies?.['sso_session'];
    if (sessionId) {
      const session = await this.sessionsService.get(sessionId);
      if (session) {
        // Hapus SEMUA session user (global logout)
        await this.sessionsService.destroyAll(session.userId);
      }
    }

    res.clearCookie('sso_session', { path: '/' });

    if (redirectUri) {
      return res.redirect(redirectUri);
    }
    return { message: 'Logout berhasil dari semua perangkat' };
  }

  // ─── POST /consent/grant ───────────────────────────────────────────────────
  // User menyetujui izin → simpan consent → generate auth code → redirect
  @Post('consent/grant')
  @HttpCode(HttpStatus.OK)
  async grantConsent(
    @Body() body: ConsentDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const sessionId = req.cookies?.['sso_session'];
    const session   = sessionId ? await this.sessionsService.get(sessionId) : null;
    if (!session) {
      return res.status(401).json({ error: 'Sesi tidak ditemukan. Silakan login ulang.' });
    }

    const client = await this.oauthService.validateClient(body.client_id, body.redirect_uri);
    if (!client) {
      return res.status(400).json({ error: 'Client tidak valid' });
    }

    const scopes = body.scope.split(' ').filter(Boolean);

    // Simpan consent ke DB
    await this.oauthService.saveConsent(session.userId, body.client_id, scopes);

    // Generate auth code
    const code = await this.oauthService.generateAuthCode(
      session.userId,
      client,
      body.redirect_uri,
      scopes,
      body.code_challenge,
      body.code_challenge_method,
      body.nonce,
    );

    const callbackUrl = new URL(body.redirect_uri);
    callbackUrl.searchParams.set('code', code);
    if (body.state) callbackUrl.searchParams.set('state', body.state);

    return res.redirect(callbackUrl.toString());
  }

  // ─── POST /consent/deny ────────────────────────────────────────────────────
  @Post('consent/deny')
  @HttpCode(HttpStatus.OK)
  async denyConsent(@Body() body: { redirect_uri: string; state?: string }) {
    const errorUrl = new URL(body.redirect_uri);
    errorUrl.searchParams.set('error', 'access_denied');
    if (body.state) errorUrl.searchParams.set('state', body.state);
    return { redirect: errorUrl.toString() };
  }

  // ─── DELETE /consent/:clientId ─────────────────────────────────────────────
  // User mencabut consent dari dashboard akun
  @Delete('consent/:clientId')
  @UseGuards(JwtAuthGuard)
  async revokeConsent(
    @Param('clientId') clientId: string,
    @Req() req: Request,
  ) {
    await this.oauthService.revokeConsent((req.user as any).id, clientId);
    return { message: 'Izin akses berhasil dicabut' };
  }

  // ─── GET /consent ──────────────────────────────────────────────────────────
  // List semua consent aktif user (untuk dashboard akun)
  @Get('consent')
  @UseGuards(JwtAuthGuard)
  async listConsents(@Req() req: Request) {
    return this.oauthService.getUserConsents((req.user as any).id);
  }

  // ─── GET /.well-known/openid-configuration ─────────────────────────────────
  @Get('.well-known/openid-configuration')
  oidcDiscovery() {
    const base = process.env.SSO_BASE_URL || 'http://41.216.191.39:4000';
    return {
      issuer:                                base,
      authorization_endpoint:               `${base}/oauth/authorize`,
      token_endpoint:                        `${base}/oauth/token`,
      userinfo_endpoint:                     `${base}/oauth/userinfo`,
      end_session_endpoint:                  `${base}/oauth/logout`,
      jwks_uri:                              `${base}/.well-known/jwks.json`,
      response_types_supported:             ['code'],
      subject_types_supported:              ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported:                     ['openid', 'profile', 'email'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
      claims_supported:                     ['sub', 'email', 'name', 'picture', 'role', 'username', 'birthDate', 'phone', 'city', 'bio', 'gender'],
      code_challenge_methods_supported:     ['S256', 'plain'],
    };
  }

  // ─── GET /.well-known/jwks.json ────────────────────────────────────────────
  // Public key untuk verifikasi JWT di client apps / Laravel
  @Get('.well-known/jwks.json')
  jwks() {
    // Pada produksi: return actual JWK dari public key RSA
    // Library: jose atau node-jose untuk convert PEM → JWK
    return {
      keys: [
        {
          kty: 'RSA',
          use: 'sig',
          alg: 'RS256',
          kid: 'purbalingga-sso-key-1',
          // n, e akan diisi dari public key RSA Anda
          // Gunakan: jose.importSPKI(publicKey, 'RS256') → exportJWK()
        },
      ],
    };
  }

  // ─── GET /sessions ─────────────────────────────────────────────────────────
  // List semua session aktif user (untuk dashboard akun)
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async listSessions(@Req() req: Request) {
    return this.sessionsService.listUserSessions((req.user as any).id);
  }

  // ─── DELETE /sessions/:sessionId ───────────────────────────────────────────
  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ) {
    const session = await this.sessionsService.get(sessionId);
    // Pastikan session milik user yang login
    if (!session || session.userId !== (req.user as any).id) {
      return { error: 'Session tidak ditemukan' };
    }
    await this.sessionsService.destroy(sessionId);
    return { message: 'Session berhasil dihapus' };
  }
}
