import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('sessions')
@Index(['token'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
export class Session extends BaseEntity {
  @Column({ type: 'varchar', length: 500, unique: true })
  token: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'varchar', nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'varchar', nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'varchar', nullable: true })
  country: string;

  @Column({ type: 'varchar', nullable: true })
  device: string;

  // User relationship
  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;
}
