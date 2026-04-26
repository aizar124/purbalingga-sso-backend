import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private monitoringService: MonitoringService,
  ) {
    super({ usernameField: 'email', passReqToCallback: true }); // pakai email bukan username
  }

  async validate(req: Request, email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      await this.monitoringService.recordLoginFailure(email, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      }, 'invalid_credentials');
      throw new UnauthorizedException('Email atau password salah');
    }
    return user;
  }
}
