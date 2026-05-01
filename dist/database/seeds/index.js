"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const dotenv = require("dotenv");
dotenv.config();
const users_entity_1 = require("../../users/users.entity");
const clients_entity_1 = require("../../clients/clients.entity");
const authorization_code_entity_1 = require("../../oauth/authorization-code.entity");
const consent_entity_1 = require("../../oauth/consent.entity");
const database_bootstrap_1 = require("../database-bootstrap");
const AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'purbalingga_sso',
    entities: [users_entity_1.User, clients_entity_1.OAuthClient, authorization_code_entity_1.AuthorizationCode, consent_entity_1.Consent],
    synchronize: true,
});
async function seed() {
    await (0, database_bootstrap_1.ensureDatabaseExists)();
    await AppDataSource.initialize();
    console.log('✅ Database terhubung');
    const userRepo = AppDataSource.getRepository(users_entity_1.User);
    const existing = await userRepo.findOne({ where: { email: 'admin@purbalingga.id' } });
    if (!existing) {
        const hashed = await bcrypt.hash('Admin1234!', 12);
        await userRepo.save({
            id: (0, uuid_1.v4)(),
            email: 'admin@purbalingga.id',
            name: 'Admin Purbalingga',
            password: hashed,
            role: users_entity_1.UserRole.SUPERADMIN,
            isVerified: true,
        });
        console.log('✅ Admin user dibuat: admin@purbalingga.id / Admin1234!');
    }
    else {
        console.log('ℹ️  Admin user sudah ada, dilewati');
    }
    const clientRepo = AppDataSource.getRepository(clients_entity_1.OAuthClient);
    const clients = [
        {
            name: 'Purbalingga SSO',
            clientId: 'purbalingga-sso',
            clientSecret: 'secret_sso_d26c259726e600a2bf28b4ea',
            redirectUris: [
                'https://sso.qode.my.id/callback',
                'https://sso.qode.my.id/callback',
                'https://sso.qode.my.id/callback',
            ],
            allowedScopes: ['openid', 'profile', 'email'],
            description: 'Portal akun Purbalingga SSO',
        },
        {
            name: 'Purbalingga Smart City',
            clientId: 'purbalingga-smart-city',
            clientSecret: 'secret_smart_city_8f3b2c91d4a6',
            redirectUris: [
                'https://apismartcity.qode.my.id/auth/sso/callback',
                'https://apismartcity.qode.my.id/api/auth/sso/callback',
                'https://apismartcity.qode.my.id/auth/sso/callback',
                'https://apismartcity.qode.my.id/api/auth/sso/callback',
                'https://apismartcity.qode.my.id/auth/sso/callback',
                'https://apismartcity.qode.my.id/api/auth/sso/callback',
                'https://apismartcity.qode.my.id/auth/sso/callback',
            ],
            allowedScopes: ['openid', 'profile', 'email'],
            description: 'Portal Smart City Purbalingga',
        },
        {
            name: 'Purbalingga Pay',
            clientId: 'purbalingga-pay',
            clientSecret: 'secret_pay_9ee5d4b6501e7c223ed6c9bb',
            redirectUris: [
                'https://smartpay.qode.my.id/callback',
                'https://smartpay.qode.my.id/callback',
                'https://smartpay.qode.my.id/callback',
            ],
            allowedScopes: ['openid', 'profile', 'email'],
            description: 'Aplikasi pembayaran digital Purbalingga',
        },
        {
            name: 'Web Wisata Purbalingga',
            clientId: 'purbalingga-wisata',
            clientSecret: 'secret_wisata_59fbcd20530fa5f3f24965ee',
            redirectUris: [
                'https://wisata.purbalingga.id/callback',
                'https://wisata.purbalingga.id/callback',
                'https://wisata.purbalingga.id/callback',
                'https://wisata.purbalingga.id/callback',
            ],
            allowedScopes: ['openid', 'profile', 'email'],
            description: 'Portal wisata Kabupaten Purbalingga',
        },
        {
            name: 'Web Monitoring',
            clientId: 'purbalingga-monitoring',
            clientSecret: 'secret_monitor_2369a41df09416b1dba1b5a7',
            redirectUris: [
                'https://monitoring.purbalingga.id/callback',
                'https://monitoring.purbalingga.id/callback',
                'https://monitoring.purbalingga.id/callback',
            ],
            allowedScopes: ['openid', 'profile', 'email'],
            description: 'Dashboard monitoring & analytics Smart City',
        },
    ];
    for (const clientData of clients) {
        const exists = await clientRepo.findOne({ where: { clientId: clientData.clientId } });
        if (!exists) {
            const saved = await clientRepo.save({ id: (0, uuid_1.v4)(), ...clientData });
            console.log(`✅ Client "${clientData.name}" dibuat`);
            console.log(`   client_id:     ${clientData.clientId}`);
            console.log(`   client_secret: ${clientData.clientSecret}`);
            console.log('   ⚠️  Simpan client_secret di atas! Tidak akan ditampilkan lagi.\n');
        }
        else {
            console.log(`ℹ️  Client "${clientData.name}" sudah ada, dilewati`);
        }
    }
    await AppDataSource.destroy();
    console.log('\n🎉 Seeding selesai!');
}
seed().catch((err) => {
    console.error('❌ Seeder error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map