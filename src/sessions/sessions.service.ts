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

@Injectable()
export class SessionsService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly SESSION_PREFIX  = 'sso_session:';
  private readonly USER_SESSIONS   = 'user_sessions:'; // Set of sessionIds per user
  private readonly ACTIVE_USERS    = 'active_users';
  private readonly LAST_ACTIVE     = 'last_active:';
  private readonly SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 hari

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
      pipeline.del(this.SESSION_PREFIX + sessionId);
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
  async saveRefreshToken(token: string, payload: { userId: string; clientId: string }): Promise<void> {
    const ttl = 60 * 60 * 24 * 30; // 30 hari
    await this.redis.setex(`refresh:${token}`, ttl, JSON.stringify(payload));
  }

  // Ambil data refresh token
  async getRefreshToken(token: string): Promise<{ userId: string; clientId: string } | null> {
    const raw = await this.redis.get(`refresh:${token}`);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  // Hapus refresh token (setelah dipakai / logout)
  async deleteRefreshToken(token: string): Promise<void> {
    await this.redis.del(`refresh:${token}`);
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
