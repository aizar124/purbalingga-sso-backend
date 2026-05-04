import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export interface SsoSession {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  userAgent?: string;
  ip?: string;
}

export interface SessionOverview extends SsoSession {
  sessionId: string;
  isCurrent: boolean;
  deviceName: string;
  browser: string;
  platform: string;
  location?: string;
  lastActiveAt?: number;
}

@Injectable()
export class SessionsService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly SESSION_PREFIX  = 'sso_session:';
  private readonly USER_SESSIONS   = 'user_sessions:'; // Set of sessionIds per user
  private readonly SESSION_TOKENS  = 'session_tokens:'; // Set of access-token jti per session
  private readonly SESSION_REFRESH_TOKENS = 'session_refresh_tokens:'; // Set of refresh tokens per session
  private readonly REVOKED_JTI     = 'revoked_access_jti:';
  private readonly ACTIVE_USERS    = 'active_users';
  private readonly LAST_ACTIVE     = 'last_active:';
  private readonly SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 hari
  private readonly REVOKED_TTL_SEC = 60 * 60 * 24; // simpan blacklist 24 jam

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.redis.on('connect', () => console.log('✅ Redis connected'));
    this.redis.on('error', (err) => console.error('❌ Redis error:', err));
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  // Buat session baru, return sessionId
  async create(data: SsoSession): Promise<string> {
    const sessionId = uuidv4();
    const key = this.SESSION_PREFIX + sessionId;

    // Simpan session data
    await this.redis.setex(key, this.SESSION_TTL_SEC, JSON.stringify(data));

    // Track session ID per user (untuk global logout)
    await this.redis.sadd(this.USER_SESSIONS + data.userId, sessionId);
    await this.redis.expire(this.USER_SESSIONS + data.userId, this.SESSION_TTL_SEC);
    await this.redis.sadd(this.ACTIVE_USERS, data.userId);
    await this.redis.expire(this.ACTIVE_USERS, this.SESSION_TTL_SEC);

    return sessionId;
  }

  // Ambil data session dari sessionId
  async get(sessionId: string): Promise<SsoSession | null> {
    const raw = await this.redis.get(this.SESSION_PREFIX + sessionId);
    if (!raw) return null;
    return JSON.parse(raw) as SsoSession;
  }

  // Hapus satu session (logout dari satu device)
  async destroy(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (session) {
      await this.revokeSessionAccessTokens(sessionId);
      await this.revokeSessionRefreshTokens(sessionId);
      await this.redis.srem(this.USER_SESSIONS + session.userId, sessionId);
      const sessionIds = await this.redis.smembers(this.USER_SESSIONS + session.userId);
      if (sessionIds.length === 0) {
        await this.redis.srem(this.ACTIVE_USERS, session.userId);
      }
    }
    await this.redis.del(this.SESSION_PREFIX + sessionId);
  }

  // Hapus SEMUA session user (global logout)
  async destroyAll(userId: string): Promise<void> {
    const sessionIds = await this.redis.smembers(this.USER_SESSIONS + userId);
    const pipeline = this.redis.pipeline();
    for (const sessionId of sessionIds) {
      await this.revokeSessionAccessTokens(sessionId);
      await this.revokeSessionRefreshTokens(sessionId);
      pipeline.del(this.SESSION_PREFIX + sessionId);
      pipeline.del(this.SESSION_TOKENS + sessionId);
      pipeline.del(this.SESSION_REFRESH_TOKENS + sessionId);
    }
    pipeline.del(this.USER_SESSIONS + userId);
    pipeline.srem(this.ACTIVE_USERS, userId);
    await pipeline.exec();
  }

  // List semua session aktif user
  async listUserSessions(userId: string): Promise<(SsoSession & { sessionId: string })[]> {
    const sessionIds = await this.redis.smembers(this.USER_SESSIONS + userId);
    const sessions = [];
    for (const sessionId of sessionIds) {
      const data = await this.get(sessionId);
      if (data) sessions.push({ ...data, sessionId });
    }
    return sessions;
  }

  private describeUserAgent(userAgent?: string) {
    const ua = userAgent || '';
    const browser =
      ua.includes('Chrome')
        ? 'Chrome'
        : ua.includes('Firefox')
          ? 'Firefox'
          : ua.includes('Safari') && !ua.includes('Chrome')
            ? 'Safari'
            : ua.includes('Edg')
              ? 'Edge'
              : 'Browser tidak dikenali';
    const platform =
      ua.includes('Windows')
        ? 'Windows'
        : ua.includes('Mac OS') || ua.includes('Macintosh')
          ? 'macOS'
          : ua.includes('Android')
            ? 'Android'
            : ua.includes('iPhone') || ua.includes('iPad')
              ? 'iOS'
              : ua.includes('Linux')
                ? 'Linux'
                : 'Platform tidak dikenali';

    return {
      browser,
      platform,
      deviceName: `${browser} on ${platform}`,
    };
  }

  async listUserSessionOverview(userId: string, currentSessionId?: string): Promise<SessionOverview[]> {
    const sessionIds = await this.redis.smembers(this.USER_SESSIONS + userId);
    const lastActive = await this.getLastActive(userId);

    const sessions = await Promise.all(
      sessionIds.map(async (sessionId) => {
        const data = await this.get(sessionId);
        if (!data) return null;

        const device = this.describeUserAgent(data.userAgent);
        return {
          ...data,
          sessionId,
          isCurrent: currentSessionId ? sessionId === currentSessionId : false,
          deviceName: device.deviceName,
          browser: device.browser,
          platform: device.platform,
          location: data.ip ? `IP ${data.ip}` : undefined,
          lastActiveAt: lastActive?.timestamp,
        };
      }),
    );

    return sessions
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt) as SessionOverview[];
  }

  async registerAccessToken(sessionId: string, jti: string): Promise<void> {
    await this.redis.sadd(this.SESSION_TOKENS + sessionId, jti);
    await this.redis.expire(this.SESSION_TOKENS + sessionId, this.SESSION_TTL_SEC);
  }

  async revokeAccessToken(jti: string): Promise<void> {
    await this.redis.setex(this.REVOKED_JTI + jti, this.REVOKED_TTL_SEC, '1');
  }

  async isAccessTokenRevoked(jti?: string): Promise<boolean> {
    if (!jti) {
      return true;
    }

    return Boolean(await this.redis.get(this.REVOKED_JTI + jti));
  }

  async revokeSessionAccessTokens(sessionId: string): Promise<void> {
    const jtis = await this.redis.smembers(this.SESSION_TOKENS + sessionId);
    if (jtis.length > 0) {
      for (const jti of jtis) {
        await this.revokeAccessToken(jti);
      }
    }
    await this.redis.del(this.SESSION_TOKENS + sessionId);
  }

  async listActiveUserIds(): Promise<string[]> {
    return this.redis.smembers(this.ACTIVE_USERS);
  }

  async removeActiveUser(userId: string): Promise<void> {
    await this.redis.srem(this.ACTIVE_USERS, userId);
  }

  async markLastActive(
    userId: string,
    timestamp = Date.now(),
    details: Record<string, any> = {},
  ): Promise<void> {
    await this.redis.set(
      this.LAST_ACTIVE + userId,
      JSON.stringify({
        timestamp,
        ...details,
      }),
      'EX',
      this.SESSION_TTL_SEC,
    );
    await this.redis.sadd(this.ACTIVE_USERS, userId);
    await this.redis.expire(this.ACTIVE_USERS, this.SESSION_TTL_SEC);
  }

  async getLastActive(userId: string): Promise<{ timestamp: number; [key: string]: any } | null> {
    const raw = await this.redis.get(this.LAST_ACTIVE + userId);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  // Simpan refresh token di Redis
  async saveRefreshToken(
    token: string,
    payload: { userId: string; clientId: string; sessionId?: string },
  ): Promise<void> {
    const ttl = 60 * 60 * 24 * 30; // 30 hari
    await this.redis.setex(`refresh:${token}`, ttl, JSON.stringify(payload));
    if (payload.sessionId) {
      await this.registerRefreshToken(payload.sessionId, token);
    }
  }

  // Ambil data refresh token
  async getRefreshToken(token: string): Promise<{ userId: string; clientId: string; sessionId?: string } | null> {
    const raw = await this.redis.get(`refresh:${token}`);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  // Hapus refresh token (setelah dipakai / logout)
  async deleteRefreshToken(token: string): Promise<void> {
    const payload = await this.getRefreshToken(token);
    if (payload?.sessionId) {
      await this.redis.srem(this.SESSION_REFRESH_TOKENS + payload.sessionId, token);
    }
    await this.redis.del(`refresh:${token}`);
  }

  async registerRefreshToken(sessionId: string, token: string): Promise<void> {
    await this.redis.sadd(this.SESSION_REFRESH_TOKENS + sessionId, token);
    await this.redis.expire(this.SESSION_REFRESH_TOKENS + sessionId, this.SESSION_TTL_SEC);
  }

  async revokeSessionRefreshTokens(sessionId: string): Promise<void> {
    const tokens = await this.redis.smembers(this.SESSION_REFRESH_TOKENS + sessionId);
    if (tokens.length > 0) {
      for (const token of tokens) {
        await this.redis.del(`refresh:${token}`);
      }
    }
    await this.redis.del(this.SESSION_REFRESH_TOKENS + sessionId);
  }

  // Simpan authorization code sementara (10 menit)
  async saveAuthCode(code: string, data: object): Promise<void> {
    await this.redis.setex(`auth_code:${code}`, 600, JSON.stringify(data));
  }

  async getAuthCode(code: string): Promise<any | null> {
    const raw = await this.redis.get(`auth_code:${code}`);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async deleteAuthCode(code: string): Promise<void> {
    await this.redis.del(`auth_code:${code}`);
  }
}
