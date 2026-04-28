export declare class AuthorizationCode {
    code: string;
    userId: string;
    clientId: string;
    redirectUri: string;
    scopes: string[];
    codeChallenge: string;
    codeChallengeMethod: string;
    nonce: string;
    expiresAt: Date;
    createdAt: Date;
}
