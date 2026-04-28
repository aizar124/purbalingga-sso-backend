"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
dotenv.config();
const database_bootstrap_1 = require("../database-bootstrap");
async function main() {
    await (0, database_bootstrap_1.runDatabaseMigrations)();
}
main().catch((error) => {
    console.error('❌ Migration gagal:', error);
    process.exit(1);
});
//# sourceMappingURL=run-migrations.js.map