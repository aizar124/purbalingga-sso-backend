import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('consents')
@Unique(['userId', 'clientId'])
export class Consent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  clientId: string;

  @Column({ type: 'json' })
  scopes: string[];

  @CreateDateColumn()
  grantedAt: Date;
}
