import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { OAuthModule } from './oauth/oauth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { SessionsModule } from './sessions/sessions.module';
import { User } from './users/users.entity';
import { OAuthClient } from './clients/clients.entity';
import { AuthorizationCode } from './oauth/authorization-code.entity';
import { Consent } from './oauth/consent.entity';
import { MonitoringEvent } from './monitoring/monitoring-event.entity';

const DEFAULT_DB_HOST = 'localhost';

@Module({
  imports: [
    // Database TypeORM + MySQL
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || DEFAULT_DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'purbalingga_sso',
      entities: [User, OAuthClient, AuthorizationCode, Consent, MonitoringEvent],
      synchronize: process.env.NODE_ENV !== 'production', // Auto-create table di dev
      logging: process.env.NODE_ENV === 'development',
    }),

    // Rate limiting global
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1 detik
        limit: 10,   // max 10 req/detik
      },
      {
        name: 'medium',
        ttl: 60000,  // 1 menit
        limit: 100,  // max 100 req/menit
      },
    ]),

    // Feature modules
    AuthModule,
    OAuthModule,
    UsersModule,
    ClientsModule,
    SessionsModule,
  ],
})
export class AppModule {}
