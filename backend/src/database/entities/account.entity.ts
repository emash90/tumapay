import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('accounts')
@Index(['providerId', 'providerAccountId'], { unique: true })
@Index(['userId'])
export class Account extends BaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'provider_id' })
  providerId: string; // e.g., 'email', 'google', 'github'

  @Column({ type: 'varchar', length: 255, name: 'provider_account_id' })
  providerAccountId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string; // Hashed password for email/password accounts

  @Column({ type: 'text', nullable: true, name: 'access_token' })
  accessToken: string;

  @Column({ type: 'text', nullable: true, name: 'refresh_token' })
  refreshToken: string;

  @Column({ type: 'timestamp', nullable: true, name: 'access_token_expires_at' })
  accessTokenExpiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'refresh_token_expires_at' })
  refreshTokenExpiresAt: Date;

  @Column({ type: 'varchar', nullable: true })
  scope: string;

  @Column({ type: 'varchar', nullable: true, name: 'id_token' })
  idToken: string;

  @Column({ type: 'varchar', nullable: true, name: 'token_type' })
  tokenType: string;

  // User relationship
  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;
}
