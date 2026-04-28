/**
 * SEEDER — Jalankan dengan: npx ts-node src/database/seeds/index.ts
 * 
 * Akan membuat:
 * - 1 admin user: admin@purbalingga.id / Admin1234!
 * - 4 OAuth clients: Purbalingga SSO, Purbalingga Pay, Web Wisata, Web Monitoring
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

import { User, UserRole } from '../../users/users.entity';
import { OAuthClient } from '../../clients/clients.entity';
import { AuthorizationCode } from '../../oauth/authorization-code.entity';
import { Consent } from '../../oauth/consent.entity';
import { ensureDatabaseExists } from '../database-bootstrap';

const AppDataSource = new DataSource({
  type: 'mysql',
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'purbalingga_sso',
  entities: [User, OAuthClient, AuthorizationCode, Consent],
  synchronize: true,
});

async function seed() {
  await ensureDatabaseExists();
  await AppDataSource.initialize();
  console.log('✅ Database terhubung');

  // ── Admin user ─────────────────────────────────────────────────────────────
  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: { email: 'admin@purbalingga.id' } });

  if (!existing) {
    const hashed = await bcrypt.hash('Admin1234!', 12);
    await userRepo.save({
      id:         uuidv4(),
      email:      'admin@purbalingga.id',
      name:       'Admin Purbalingga',
      password:   hashed,
      role:       UserRole.SUPERADMIN,
      isVerified: true,
    });
    console.log('✅ Admin user dibuat: admin@purbalingga.id / Admin1234!');
  } else {
    console.log('ℹ️  Admin user sudah ada, dilewati');
  }

  // ── OAuth clients ──────────────────────────────────────────────────────────
  const clientRepo = AppDataSource.getRepository(OAuthClient);

  const clients = [
    {
      name:         'Purbalingga SSO',
      clientId:     'purbalingga-sso',
      clientSecret: 'secret_sso_' + crypto.randomBytes(12).toString('hex'),
      redirectUris: [
        'http://localhost:5174/callback',
        'http://41.216.191.39:5174/callback',
        'https://sso.purbalingga.id/callback',
      ],
      allowedScopes: ['openid', 'profile', 'email'],
      description:  'Portal akun Purbalingga SSO',
    },
    {
      name:         'Purbalingga Smart City',
      clientId:     'purbalingga-smart-city',
      clientSecret: 'secret_smart_city_8f3b2c91d4a6',
      redirectUris: [
        'http://localhost:8000/auth/sso/callback',
        'http://localhost:8000/api/auth/sso/callback',
        'http://41.216.191.39:8000/auth/sso/callback',
        'http://41.216.191.39:8000/api/auth/sso/callback',
        'https://smartcity.purbalingga.id/auth/sso/callback',
      ],
      allowedScopes: ['openid', 'profile', 'email'],
      description:  'Portal Smart City Purbalingga',
    },
    {
      name:         'Purbalingga Pay',
      clientId:     'purbalingga-pay',
      clientSecret: 'secret_pay_' + crypto.randomBytes(12).toString('hex'),
      redirectUris: [
        'http://localhost:5173/callback',
        'http://41.216.191.39:5173/callback',
        'https://pay.purbalingga.id/callback',
      ],
      allowedScopes: ['openid', 'profile', 'email'],
      description:  'Aplikasi pembayaran digital Purbalingga',
    },
    {
      name:         'Web Wisata Purbalingga',
      clientId:     'purbalingga-wisata',
      clientSecret: 'secret_wisata_' + crypto.randomBytes(12).toString('hex'),
      redirectUris: [
        'http://localhost:3001/callback',
        'http://41.216.191.39:3001/callback',
        'https://wisata.purbalingga.id/callback',
      ],
      allowedScopes: ['openid', 'profile', 'email'],
      description:  'Portal wisata Kabupaten Purbalingga',
    },
    {
      name:         'Web Monitoring',
      clientId:     'purbalingga-monitoring',
      clientSecret: 'secret_monitor_' + crypto.randomBytes(12).toString('hex'),
      redirectUris: [
        'http://localhost:3002/callback',
        'http://41.216.191.39:3002/callback',
        'https://monitoring.purbalingga.id/callback',
      ],
      allowedScopes: ['openid', 'profile', 'email'],
      description:  'Dashboard monitoring & analytics Smart City',
    },
  ];

  for (const clientData of clients) {
    const exists = await clientRepo.findOne({ where: { clientId: clientData.clientId } });
    if (!exists) {
      const saved = await clientRepo.save({ id: uuidv4(), ...clientData });
      console.log(`✅ Client "${clientData.name}" dibuat`);
      console.log(`   client_id:     ${clientData.clientId}`);
      console.log(`   client_secret: ${clientData.clientSecret}`);
      console.log('   ⚠️  Simpan client_secret di atas! Tidak akan ditampilkan lagi.\n');
    } else {
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
