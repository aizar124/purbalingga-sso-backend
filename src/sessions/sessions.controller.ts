import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listSessions(@Req() req: Request) {
    const user = req.user as any;
    const currentSessionId = req.cookies?.['sso_session'];
    const sessions = await this.sessionsService.listUserSessionOverview(user.id, currentSessionId);
    const lastActive = await this.sessionsService.getLastActive(user.id);
    const latestSession = sessions[0] || null;

    return {
      sessions,
      total: sessions.length,
      currentSessionId: currentSessionId || null,
      lastLoginAt: lastActive?.timestamp ? new Date(lastActive.timestamp).toISOString() : latestSession?.createdAt ? new Date(latestSession.createdAt).toISOString() : null,
      lastActiveAt: lastActive?.timestamp ? new Date(lastActive.timestamp).toISOString() : null,
      latestSessionId: latestSession?.sessionId || null,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @Param('id') sessionId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as any;
    const session = await this.sessionsService.get(sessionId);
    if (!session || session.userId !== user.id) {
      throw new NotFoundException('Sesi tidak ditemukan');
    }

    await this.sessionsService.destroy(sessionId);

    if (req.cookies?.['sso_session'] === sessionId) {
      res.clearCookie('sso_session', { path: '/' });
    }

    return { message: 'Sesi berhasil diakhiri' };
  }
}
