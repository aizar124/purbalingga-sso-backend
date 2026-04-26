import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser (untuk SSO session cookie)
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // Strip properti yang tidak ada di DTO
      forbidNonWhitelisted: true,
      transform: true,         // Auto-transform types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS — izinkan client apps.
  // FRONTEND_URL ikut dimasukkan supaya deploy tidak bergantung sepenuhnya
  // pada CORS_ORIGINS manual.
  const corsOrigins = Array.from(
    new Set(
      [
        process.env.CORS_ORIGINS,
        process.env.FRONTEND_URL,
        process.env.SSO_BASE_URL,
      ]
        .filter(Boolean)
        .flatMap((value) => value.split(','))
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  );

  const allowedOrigins = corsOrigins.length
    ? corsOrigins
    : ['http://localhost:5173', 'http://localhost:5174'];

  app.enableCors({
    origin: (origin, callback) => {
      // Request tanpa Origin biasanya datang dari curl/server-side request.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`), false);
    },
    credentials: true,          // Izinkan cookie cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  console.log(`🌐 CORS origins: ${allowedOrigins.join(', ')}`);

  // Global prefix (opsional, hapus kalau tidak mau)
  // app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Purbalingga SSO Server berjalan di http://localhost:${port}`);
  console.log(`📄 OIDC Discovery: http://localhost:${port}/.well-known/openid-configuration`);
}

bootstrap();
