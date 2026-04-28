import * as mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2/promise';
import { promises as fs } from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { OAuthClient } from '../clients/clients.entity';

export interface DatabaseBootstrapOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  charset?: string;
  collation?: string;
}

function shouldAutoCreateDatabase(): boolean {
  return process.env.DB_AUTO_CREATE !== 'false';
}

function shouldAutoMigrate(): boolean {
  return process.env.DB_AUTO_MIGRATE !== 'false';
}

export async function runDatabaseMigrations(): Promise<void> {
  if (!shouldAutoMigrate()) {
    return;
  }

  await ensureDatabaseExists();

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'purbalingga_sso';

  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (!migrationFiles.length) {
    console.log('ℹ️  Tidak ada file migrasi SQL yang ditemukan');
    return;
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT migration_name FROM app_migrations ORDER BY migration_name ASC',
    );
    const applied = new Set(rows.map((row) => String(row.migration_name)));

    for (const file of migrationFiles) {
      if (applied.has(file)) {
        console.log(`↩️  Migrasi dilewati: ${file}`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');

      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.query(
          'INSERT INTO app_migrations (migration_name) VALUES (?)',
          [file],
        );
        await connection.commit();
        console.log(`✅ Migrasi dijalankan: ${file}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    await connection.end();
  }
}

export async function ensureDatabaseExists(
  options: Partial<DatabaseBootstrapOptions> = {},
): Promise<void> {
  if (!shouldAutoCreateDatabase()) {
    return;
  }

  const host = options.host || process.env.DB_HOST || 'localhost';
  const port = options.port || parseInt(process.env.DB_PORT || '3306', 10);
  const user = options.user || process.env.DB_USER || 'root';
  const password = options.password || process.env.DB_PASS || '';
  const database = options.database || process.env.DB_NAME || 'purbalingga_sso';
  const charset = options.charset || 'utf8mb4';
  const collation = options.collation || 'utf8mb4_unicode_ci';

  if (!database) {
    console.warn('⚠️  DB_NAME kosong, bootstrap database dilewati');
    return;
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: false,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database.replace(/`/g, '``')}\` CHARACTER SET ${charset} COLLATE ${collation}`,
    );
    console.log(`✅ Database siap: ${database}`);
  } catch (error) {
    console.error('❌ Gagal memastikan database tersedia:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

const DEFAULT_SMART_CITY_CLIENT = {
  name: 'Purbalingga Smart City',
  clientId: 'purbalingga-smart-city',
  clientSecret: 'secret_smart_city_8f3b2c91d4a6',
  redirectUris: [
    'http://localhost:8000/auth/sso/callback',
    'http://localhost:8000/api/auth/sso/callback',
    'http://41.216.191.39:8000/auth/sso/callback',
    'http://41.216.191.39:8000/api/auth/sso/callback',
    'https://smartcity.purbalingga.id/auth/sso/callback',
  ],
  allowedScopes: ['openid', 'profile', 'email'],
  description: 'Portal Smart City Purbalingga',
};

export async function ensureDefaultOAuthClients(): Promise<void> {
  if (!shouldAutoCreateDatabase()) {
    return;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'purbalingga_sso';

  const dataSource = new DataSource({
    type: 'mysql',
    host,
    port,
    username: user,
    password,
    database,
    entities: [OAuthClient],
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    const repo = dataSource.getRepository(OAuthClient);
    const existing = await repo.findOne({ where: { clientId: DEFAULT_SMART_CITY_CLIENT.clientId } });

    if (!existing) {
      await repo.save(DEFAULT_SMART_CITY_CLIENT);
      console.log(`✅ OAuth client siap: ${DEFAULT_SMART_CITY_CLIENT.clientId}`);
      return;
    }

    const nextRedirectUris = JSON.stringify(existing.redirectUris) !== JSON.stringify(DEFAULT_SMART_CITY_CLIENT.redirectUris);
    const nextSecret = existing.clientSecret !== DEFAULT_SMART_CITY_CLIENT.clientSecret;
    const nextName = existing.name !== DEFAULT_SMART_CITY_CLIENT.name;
    const nextDescription = existing.description !== DEFAULT_SMART_CITY_CLIENT.description;

    if (nextRedirectUris || nextSecret || nextName || nextDescription) {
      await repo.update({ clientId: DEFAULT_SMART_CITY_CLIENT.clientId }, DEFAULT_SMART_CITY_CLIENT);
      console.log(`✅ OAuth client diperbarui: ${DEFAULT_SMART_CITY_CLIENT.clientId}`);
    }
  } finally {
    await dataSource.destroy();
  }
}
