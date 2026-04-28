export declare class AuthorizeDto {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    scope?: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
    nonce?: string;
}
export declare class TokenDto {
    grant_type: string;
    code?: string;
    code_verifier?: string;
    redirect_uri?: string;
    client_id?: string;
    client_secret?: string;
    refresh_token?: string;
}
export declare class ConsentDto {
    client_id: string;
    redirect_uri: string;
    scope: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
    nonce?: string;
}
