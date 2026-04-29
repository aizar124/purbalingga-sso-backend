"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
dotenv.config();
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookieParser = require("cookie-parser");
const app_module_1 = require("./app.module");
const database_bootstrap_1 = require("./database/database-bootstrap");
async function bootstrap() {
    if (process.env.DB_AUTO_MIGRATE !== 'false') {
        await (0, database_bootstrap_1.runDatabaseMigrations)();
    }
    await (0, database_bootstrap_1.ensureDefaultOAuthClients)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(cookieParser());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const corsOrigins = Array.from(new Set([
        process.env.CORS_ORIGINS,
        process.env.FRONTEND_URL,
        process.env.SSO_BASE_URL,
    ]
        .filter(Boolean)
        .flatMap((value) => value.split(','))
        .map((origin) => origin.trim())
        .filter(Boolean)));
    const allowedOrigins = corsOrigins.length
        ? corsOrigins
        : [
            'http://41.216.191.37:5173',
            'http://41.216.191.39:5173',
            'http://41.216.191.39:5174',
        ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.includes(origin))
                return callback(null, true);
            return callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`), false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    console.log(`🌐 CORS origins: ${allowedOrigins.join(', ')}`);
    const port = process.env.PORT || 4000;
    await app.listen(port);
    const publicBaseUrl = process.env.SSO_BASE_URL || `http://41.216.191.39:${port}`;
    console.log(`🚀 Purbalingga SSO Server berjalan di ${publicBaseUrl}`);
    console.log(`📄 OIDC Discovery: ${publicBaseUrl}/.well-known/openid-configuration`);
}
bootstrap();
//# sourceMappingURL=main.js.map