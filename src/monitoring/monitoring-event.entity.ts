import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MonitoringEventType {
  REGISTER_SUCCESS = 'register_success',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  TOKEN_VALIDATE = 'token_validate',
  ACTIVITY = 'activity',
  LAST_ACTIVE = 'last_active',
  USERS_LIST = 'users_list',
  USER_DETAIL = 'user_detail',
  ACTIVE_USERS_LIST = 'active_users_list',
  ACTIVE_USERS_DETAIL = 'active_users_detail',
}

@Entity('monitoring_events')
export class MonitoringEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'enum', enum: MonitoringEventType })
  eventType: MonitoringEventType;

  @Index()
  @Column({ nullable: true })
  actorUserId: string;

  @Index()
  @Column({ nullable: true })
  subjectUserId: string;

  @Index()
  @Column({ nullable: true })
  clientId: string;

  @Column({ nullable: true, length: 120 })
  route: string;

  @Column({ nullable: true, length: 16 })
  method: string;

  @Column({ default: true })
  success: boolean;

  @Column({ nullable: true })
  statusCode: number;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true, length: 255 })
  userAgent: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
