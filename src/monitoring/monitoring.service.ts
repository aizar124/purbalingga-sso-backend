import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository, In, Between } from 'typeorm';
import { MonitoringEvent, MonitoringEventType } from './monitoring-event.entity';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.entity';

type RequestMeta = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class MonitoringService {
  constructor(
    @InjectRepository(MonitoringEvent)
    private monitoringRepo: Repository<MonitoringEvent>,
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private jwtService: JwtService,
  ) {}

  private stripUser(user: User) {
    if (!user) return null;
    const { password, mfaSecret, verifyToken, resetToken, ...safe } = user as any;
    return safe;
  }

  private normalizeDateRange(date?: string) {
    const base = date ? new Date(`${date}T00:00:00`) : new Date();
    if (Number.isNaN(base.getTime())) {
      throw new UnauthorizedException('Format tanggal tidak valid');
    }

    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async recordEvent(event: Partial<MonitoringEvent>) {
    const payload = this.monitoringRepo.create({
      success: true,
      ...event,
    });
    return this.monitoringRepo.save(payload);
  }

  async recordRegister(user: User, meta: RequestMeta = {}) {
    await this.recordEvent({
      eventType: MonitoringEventType.REGISTER_SUCCESS,
      actorUserId: user.id,
      subjectUserId: user.id,
      route: '/auth/register',
      method: 'POST',
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: {
        email: user.email,
        username: user.username,
      },
    });
  }

  async recordLoginSuccess(user: User, meta: RequestMeta = {}, extra?: Record<string, any>) {
    await this.recordEvent({
      eventType: MonitoringEventType.LOGIN_SUCCESS,
      actorUserId: user.id,
      subjectUserId: user.id,
      clientId: extra?.clientId,
      route: '/auth/login',
      method: 'POST',
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: extra || {},
    });
  }

  async recordLoginFailure(email: string, meta: RequestMeta = {}, reason?: string) {
    await this.recordEvent({
      eventType: MonitoringEventType.LOGIN_FAILED,
      route: '/auth/login',
      method: 'POST',
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: {
        email,
        reason,
      },
      success: false,
      statusCode: 401,
    });
  }

  async recordTokenValidation(token: string, success: boolean, meta: RequestMeta = {}, details?: Record<string, any>) {
    await this.recordEvent({
      eventType: MonitoringEventType.TOKEN_VALIDATE,
      success,
      route: '/api/validate-token',
      method: 'POST',
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: {
        tokenPreview: token?.slice(0, 16),
        ...details,
      },
      statusCode: success ? 200 : 401,
    });
  }

  async recordActivity(userId: string, data: Record<string, any>, meta: RequestMeta = {}) {
    await this.sessionsService.markLastActive(userId, Date.now(), {
      action: data.action,
      path: data.path,
      page: data.page,
      title: data.title,
      clientId: data.clientId,
      metadata: data.metadata || {},
    });

    await this.recordEvent({
      eventType: MonitoringEventType.ACTIVITY,
      actorUserId: userId,
      subjectUserId: userId,
      clientId: data.clientId,
      route: data.path || '/api/activity',
      method: 'POST',
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: {
        action: data.action,
        page: data.page,
        title: data.title,
        metadata: data.metadata || {},
      },
    });
  }

  async recordLastActive(userId: string, data: Record<string, any> = {}, meta: RequestMeta = {}) {
    await this.sessionsService.markLastActive(userId, Date.now(), {
      clientId: data.clientId,
      metadata: data.metadata || {},
    });

    await this.recordEvent({
      eventType: MonitoringEventType.LAST_ACTIVE,
      actorUserId: userId,
      subjectUserId: userId,
      clientId: data.clientId,
      route: '/api/last-active',
      method: 'POST',
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: data.metadata || {},
    });
  }

  async validateToken(token: string, meta: RequestMeta = {}) {
    try {
      const claims = await this.jwtService.verifyAsync(token, {
        publicKey: process.env.JWT_PUBLIC_KEY,
        algorithms: ['RS256'],
      });

      const user = await this.usersService.findById(claims.sub);
      const safeUser = user ? this.stripUser(user) : null;

      await this.recordTokenValidation(token, true, meta, {
        userId: claims.sub,
        email: claims.email,
        clientId: claims.client_id,
      });

      return {
        valid: true,
        claims,
        user: safeUser,
      };
    } catch (error) {
      await this.recordTokenValidation(token, false, meta, {
        reason: error?.message || 'invalid_token',
      });
      return {
        valid: false,
        reason: error?.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token',
      };
    }
  }

  async getLoginReport(date?: string, limit = 20) {
    const { start, end } = this.normalizeDateRange(date);
    const [successCount, failedCount, events] = await Promise.all([
      this.monitoringRepo.count({
        where: {
          eventType: MonitoringEventType.LOGIN_SUCCESS,
          createdAt: Between(start, end),
        },
      }),
      this.monitoringRepo.count({
        where: {
          eventType: MonitoringEventType.LOGIN_FAILED,
          createdAt: Between(start, end),
        },
      }),
      this.monitoringRepo.find({
        where: {
          eventType: In([MonitoringEventType.LOGIN_SUCCESS, MonitoringEventType.LOGIN_FAILED]),
          createdAt: Between(start, end),
        },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
    ]);

    const items = await Promise.all(
      events.map(async (event) => ({
        ...event,
        user: event.subjectUserId ? this.stripUser(await this.usersService.findById(event.subjectUserId)) : null,
      })),
    );

    return {
      date: date || new Date().toISOString().slice(0, 10),
      total: successCount + failedCount,
      success: successCount,
      failed: failedCount,
      items,
    };
  }

  async getRegisterReport(date?: string, limit = 20) {
    const { start, end } = this.normalizeDateRange(date);
    const [total, events] = await Promise.all([
      this.monitoringRepo.count({
        where: {
          eventType: MonitoringEventType.REGISTER_SUCCESS,
          createdAt: Between(start, end),
        },
      }),
      this.monitoringRepo.find({
        where: {
          eventType: MonitoringEventType.REGISTER_SUCCESS,
          createdAt: Between(start, end),
        },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
    ]);

    const items = await Promise.all(
      events.map(async (event) => ({
        ...event,
        user: event.subjectUserId ? this.stripUser(await this.usersService.findById(event.subjectUserId)) : null,
      })),
    );

    return {
      date: date || new Date().toISOString().slice(0, 10),
      total,
      items,
    };
  }

  async listUsers(limit = 100, page = 1) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.usersService.findManySafe(limit, skip),
      this.usersService.countUsers(),
    ]);

    await this.recordEvent({
      eventType: MonitoringEventType.USERS_LIST,
      route: '/api/users',
      method: 'GET',
      success: true,
      metadata: {
        limit,
        page,
      },
    });

    return {
      items: users,
      total,
      page,
      limit,
    };
  }

  async getUserDetail(id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User tidak ditemukan');

    await this.recordEvent({
      eventType: MonitoringEventType.USER_DETAIL,
      subjectUserId: id,
      route: `/api/users/${id}`,
      method: 'GET',
      success: true,
    });

    return this.stripUser(user);
  }

  async listActiveUsers(detail = false) {
    const activeUserIds = await this.sessionsService.listActiveUserIds();
    const uniqueIds = Array.from(new Set(activeUserIds));
    const items = [];

    for (const userId of uniqueIds) {
      const sessions = await this.sessionsService.listUserSessions(userId);
      if (!sessions.length) {
        await this.sessionsService.removeActiveUser(userId);
        continue;
      }

      const user = await this.usersService.findById(userId);
      if (!user) continue;

      const lastActive = await this.sessionsService.getLastActive(userId);
      items.push({
        ...this.stripUser(user),
        lastActive,
        sessionCount: sessions.length,
        sessions: detail ? sessions : undefined,
      });
    }

    await this.recordEvent({
      eventType: detail
        ? MonitoringEventType.ACTIVE_USERS_DETAIL
        : MonitoringEventType.ACTIVE_USERS_LIST,
      route: detail ? '/api/active-users/detail' : '/api/active-users',
      method: 'GET',
      success: true,
      metadata: {
        count: items.length,
      },
    });

    return {
      total: items.length,
      items,
    };
  }
}
