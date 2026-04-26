import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { TokenService } from './token.service';
import { AuthorizationCode } from './authorization-code.entity';
import { Consent } from './consent.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthorizationCode, Consent]),
    AuthModule,
    UsersModule,
    ClientsModule,
  ],
  controllers: [OAuthController],
  providers: [OAuthService, TokenService],
  exports: [OAuthService, TokenService],
})
export class OAuthModule {}
