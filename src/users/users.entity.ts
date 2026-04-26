import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER       = 'user',
  ADMIN      = 'admin',
  SUPERADMIN = 'superadmin',
}

export enum UserGender {
  MALE   = 'male',
  FEMALE = 'female',
  OTHER  = 'other',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'longtext', nullable: true })
  avatarUrl: string;

  @Column({ type: 'date', nullable: true })
  birthDate: string;

  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ nullable: true, length: 120 })
  city: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  gender: UserGender;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifyToken: string;

  @Column({ nullable: true })
  verifyTokenExpiry: Date;

  @Column({ nullable: true })
  mfaSecret: string;

  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ nullable: true })
  resetTokenExpiry: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
