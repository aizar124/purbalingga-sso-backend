import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('oauth_clients')
export class OAuthClient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  clientId: string;

  @Column()
  clientSecret: string;

  // Daftar redirect URI yang diizinkan (JSON array)
  @Column({ type: 'json' })
  redirectUris: string[];

  // Scope yang diizinkan (JSON array)
  @Column({ type: 'json' })
  allowedScopes: string[];

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
