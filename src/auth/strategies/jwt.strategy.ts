import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { SessionsService } from '../../sessions/sessions.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKey: process.env.JWT_PUBLIC_KEY,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User tidak ditemukan');
    if (await this.sessionsService.isAccessTokenRevoked(payload.jti)) {
      throw new UnauthorizedException('Token sudah dicabut');
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      scopes: payload.scopes,
      clientId: payload.client_id,
      sessionId: payload.sid,
    };
  }
}
