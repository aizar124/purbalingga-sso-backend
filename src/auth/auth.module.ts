import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    UsersModule,
    MonitoringModule,
    PassportModule,
    JwtModule.register({
      privateKey: process.env.JWT_PRIVATE_KEY,
      publicKey:  process.env.JWT_PUBLIC_KEY,
      // DISINI YANG ?.replace(/\\n/g, '\n')
      signOptions: {
        algorithm: 'RS256',
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
        
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtModule, EmailService],
})
export class AuthModule {}
