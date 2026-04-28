import * as dotenv from 'dotenv';
dotenv.config();

import { runDatabaseMigrations } from '../database-bootstrap';

async function main() {
  await runDatabaseMigrations();
}

main().catch((error) => {
  console.error('❌ Migration gagal:', error);
  process.exit(1);
});
