"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabaseExists = ensureDatabaseExists;
exports.ensureDefaultOAuthClients = ensureDefaultOAuthClients;
const mysql = require("mysql2/promise");
const typeorm_1 = require("typeorm");
const clients_entity_1 = require("../clients/clients.entity");
function shouldAutoCreateDatabase() {
    return process.env.DB_AUTO_CREATE !== 'false';
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
        'http://localhost:8000/auth/sso/callback',
        'http://localhost:8000/api/auth/sso/callback',
        'https://smartcity.purbalingga.id/auth/sso/callback',
    ],
    allowedScopes: ['openid', 'profile', 'email'],
    description: 'Portal Smart City Purbalingga',
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
    }
    finally {
        await dataSource.destroy();
    }
}
//# sourceMappingURL=database-bootstrap.js.map