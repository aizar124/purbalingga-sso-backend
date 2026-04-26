import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('authorization_codes')
export class AuthorizationCode {
  @PrimaryColumn()
  code: string;

  @Column()
  userId: string;

  @Column()
  clientId: string;

  @Column()
  redirectUri: string;

  @Column({ type: 'json' })
  scopes: string[];

  @Column({ nullable: true })
  codeChallenge: string;       // PKCE

  @Column({ nullable: true })
  codeChallengeMethod: string; // 'S256'

  @Column({ nullable: true })
  nonce: string;               // OIDC nonce

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
