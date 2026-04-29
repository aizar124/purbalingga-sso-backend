"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDatabaseMigrations = runDatabaseMigrations;
exports.ensureDatabaseExists = ensureDatabaseExists;
exports.ensureDefaultOAuthClients = ensureDefaultOAuthClients;
const mysql = require("mysql2/promise");
const fs_1 = require("fs");
const path = require("path");
const typeorm_1 = require("typeorm");
const clients_entity_1 = require("../clients/clients.entity");
function shouldAutoCreateDatabase() {
    return process.env.DB_AUTO_CREATE !== 'false';
}
function shouldAutoMigrate() {
    return process.env.DB_AUTO_MIGRATE !== 'false';
}
async function runDatabaseMigrations() {
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
    const migrationFiles = (await fs_1.promises.readdir(migrationsDir))
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
        const [rows] = await connection.query('SELECT migration_name FROM app_migrations ORDER BY migration_name ASC');
        const applied = new Set(rows.map((row) => String(row.migration_name)));
        for (const file of migrationFiles) {
            if (applied.has(file)) {
                console.log(`↩️  Migrasi dilewati: ${file}`);
                continue;
            }
            const filePath = path.join(migrationsDir, file);
            const sql = await fs_1.promises.readFile(filePath, 'utf8');
            await connection.beginTransaction();
            try {
                await connection.query(sql);
                await connection.query('INSERT INTO app_migrations (migration_name) VALUES (?)', [file]);
                await connection.commit();
                console.log(`✅ Migrasi dijalankan: ${file}`);
            }
            catch (error) {
                await connection.rollback();
                throw error;
            }
        }
    }
    finally {
        await connection.end();
    }
}
async function ensureDatabaseExists(options = {}) {
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
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database.replace(/`/g, '``')}\` CHARACTER SET ${charset} COLLATE ${collation}`);
        console.log(`✅ Database siap: ${database}`);
    }
    catch (error) {
        console.error('❌ Gagal memastikan database tersedia:', error);
        throw error;
    }
    finally {
        await connection.end();
    }
}
const DEFAULT_SMART_CITY_CLIENT = {
    name: 'Purbalingga Smart City',
    clientId: 'purbalingga-smart-city',
    clientSecret: 'secret_smart_city_8f3b2c91d4a6',
    redirectUris: [
        'http://41.216.191.37:8000/auth/sso/callback',
        'http://41.216.191.37:8000/api/auth/sso/callback',
        'http://41.216.191.37:8000/auth/sso/callback',
        'http://41.216.191.37:8000/api/auth/sso/callback',
        'http://41.216.191.37:8000/auth/sso/callback',
        'http://41.216.191.37:8000/api/auth/sso/callback',
        'https://smartcity.purbalingga.id/auth/sso/callback',
    ],
    allowedScopes: ['openid', 'profile', 'email'],
    description: 'Portal Smart City Purbalingga',
};
const DEFAULT_SSO_CLIENT = {
    name: 'Purbalingga SSO',
    clientId: 'purbalingga-sso',
    clientSecret: 'secret_sso_d26c259726e600a2bf28b4ea',
    redirectUris: [
        'http://41.216.191.39:5174/callback',
        'http://41.216.191.39:5174/callback',
        'https://sso.purbalingga.id/callback',
    ],
    allowedScopes: ['openid', 'profile', 'email'],
    description: 'Portal akun Purbalingga SSO',
};
const DEFAULT_PAY_CLIENT = {
    name: 'Purbalingga Pay',
    clientId: 'purbalingga-pay',
    clientSecret: 'secret_pay_9ee5d4b6501e7c223ed6c9bb',
    redirectUris: [
        'http://41.216.191.39:5173/callback',
        'http://41.216.191.39:5173/callback',
        'https://pay.purbalingga.id/callback',
    ],
    allowedScopes: ['openid', 'profile', 'email'],
    description: 'Aplikasi pembayaran digital Purbalingga',
};
const DEFAULT_WISATA_CLIENT = {
    name: 'Web Wisata Purbalingga',
    clientId: 'purbalingga-wisata',
    clientSecret: 'secret_wisata_59fbcd20530fa5f3f24965ee',
    redirectUris: [
        'http://localhost:3001/callback',
        'http://localhost:3001/callback',
        'http://localhost:3001/callback',
        'https://wisata.purbalingga.id/callback',
    ],
    allowedScopes: ['openid', 'profile', 'email'],
    description: 'Portal wisata Kabupaten Purbalingga',
};
const DEFAULT_MONITORING_CLIENT = {
    name: 'Web Monitoring',
    clientId: 'purbalingga-monitoring',
    clientSecret: 'secret_monitor_2369a41df09416b1dba1b5a7',
    redirectUris: [
        'http://localhost:3002/callback',
        'http://localhost:3002/callback',
        'https://monitoring.purbalingga.id/callback',
    ],
    allowedScopes: ['openid', 'profile', 'email'],
    description: 'Dashboard monitoring & analytics Smart City',
};
async function ensureDefaultOAuthClients() {
    if (!shouldAutoCreateDatabase()) {
        return;
    }
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASS || '';
    const database = process.env.DB_NAME || 'purbalingga_sso';
    const dataSource = new typeorm_1.DataSource({
        type: 'mysql',
        host,
        port,
        username: user,
        password,
        database,
        entities: [clients_entity_1.OAuthClient],
        synchronize: false,
    });
    await dataSource.initialize();
    try {
        const repo = dataSource.getRepository(clients_entity_1.OAuthClient);
        const clients = [
            DEFAULT_SSO_CLIENT,
            DEFAULT_SMART_CITY_CLIENT,
            DEFAULT_PAY_CLIENT,
            DEFAULT_WISATA_CLIENT,
            DEFAULT_MONITORING_CLIENT,
        ];
        for (const client of clients) {
            const existing = await repo.findOne({ where: { clientId: client.clientId } });
            if (!existing) {
                await repo.save(client);
                console.log(`✅ OAuth client siap: ${client.clientId}`);
                continue;
            }
            const nextRedirectUris = JSON.stringify(existing.redirectUris) !== JSON.stringify(client.redirectUris);
            const nextSecret = existing.clientSecret !== client.clientSecret;
            const nextName = existing.name !== client.name;
            const nextDescription = existing.description !== client.description;
            if (nextRedirectUris || nextSecret || nextName || nextDescription) {
                await repo.update({ clientId: client.clientId }, client);
                console.log(`✅ OAuth client diperbarui: ${client.clientId}`);
            }
        }
    }
    finally {
        await dataSource.destroy();
    }
}
//# sourceMappingURL=database-bootstrap.js.map