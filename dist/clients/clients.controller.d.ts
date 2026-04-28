import { ClientsService } from './clients.service';
export declare class ClientsController {
    private clientsService;
    constructor(clientsService: ClientsService);
    findAll(): Promise<import("./clients.entity").OAuthClient[]>;
    create(body: {
        name: string;
        redirectUris: string[];
        allowedScopes?: string[];
        description?: string;
    }): Promise<import("./clients.entity").OAuthClient & {
        plainSecret: string;
    }>;
}
