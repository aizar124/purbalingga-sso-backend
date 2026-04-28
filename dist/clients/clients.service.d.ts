import { Repository } from 'typeorm';
import { OAuthClient } from './clients.entity';
export declare class ClientsService {
    private clientsRepo;
    constructor(clientsRepo: Repository<OAuthClient>);
    findByClientId(clientId: string): Promise<OAuthClient | null>;
    validateClient(clientId: string, redirectUri: string): Promise<OAuthClient | null>;
    validateClientCredentials(clientId: string, clientSecret: string): Promise<OAuthClient | null>;
    create(data: {
        name: string;
        redirectUris: string[];
        allowedScopes?: string[];
        logoUrl?: string;
        description?: string;
    }): Promise<OAuthClient & {
        plainSecret: string;
    }>;
    findAll(): Promise<OAuthClient[]>;
}
