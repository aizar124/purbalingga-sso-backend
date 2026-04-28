export interface DatabaseBootstrapOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    charset?: string;
    collation?: string;
}
export declare function ensureDatabaseExists(options?: Partial<DatabaseBootstrapOptions>): Promise<void>;
export declare function ensureDefaultOAuthClients(): Promise<void>;
