import { IsString, IsOptional, IsIn } from 'class-validator';

export class AuthorizeDto {
  @IsString()
  response_type: string;       // 'code'

  @IsString()
  client_id: string;

  @IsString()
  redirect_uri: string;

  @IsString()
  @IsOptional()
  scope?: string;              // 'openid profile email'

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  code_challenge?: string;     // PKCE

  @IsString()
  @IsOptional()
  code_challenge_method?: string; // 'S256'

  @IsString()
  @IsOptional()
  nonce?: string;              // OIDC
}

export class TokenDto {
  @IsString()
  grant_type: string;          // 'authorization_code' | 'refresh_token'

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  code_verifier?: string;      // PKCE verifier

  @IsString()
  @IsOptional()
  redirect_uri?: string;

  @IsString()
  @IsOptional()
  client_id?: string;

  @IsString()
  @IsOptional()
  client_secret?: string;

  @IsString()
  @IsOptional()
  refresh_token?: string;
}

export class ConsentDto {
  @IsString()
  client_id: string;

  @IsString()
  redirect_uri: string;

  @IsString()
  scope: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  code_challenge?: string;

  @IsString()
  @IsOptional()
  code_challenge_method?: string;

  @IsString()
  @IsOptional()
  nonce?: string;
}
