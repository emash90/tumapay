import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../database/entities/session.entity';
import * as crypto from 'crypto';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
  private readonly CACHE_KEY_PREFIX = 'session:';

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {
    this.verifyRedisConnection();
  }

  /**
   * Verify Redis connection on startup
   */
  private async verifyRedisConnection(): Promise<void> {
    try {
      await this.redisClient.ping();
      this.logger.log('Redis connection verified');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error.message);
    }
  }

  /**
   * Create a new session (store in both Redis and PostgreSQL)
   */
  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    try {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // Create session in database (source of truth)
      const session = this.sessionRepository.create({
        userId,
        token,
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });

      const savedSession = await this.sessionRepository.save(session);

      // Cache session in Redis for fast access
      await this.cacheSession(savedSession);

      return savedSession;
    } catch (error) {
      this.logger.error('Failed to create session:', error.message);
      throw error;
    }
  }

  /**
   * Get session by token (Redis first, then PostgreSQL)
   */
  async getSession(token: string): Promise<Session | null> {
    try {
      // FAST PATH: Try Redis first
      const cacheKey = this.getCacheKey(token);
      const cachedData = await this.redisClient.get(cacheKey);

      if (cachedData) {
        const cachedSession: Session = JSON.parse(cachedData);

        // Validate expiration
        if (new Date() > new Date(cachedSession.expiresAt)) {
          await this.invalidateSession(token);
          return null;
        }
        return cachedSession;
      }

      // SLOW PATH: Cache miss - query database
      const session = await this.sessionRepository.findOne({
        where: { token, isActive: true },
        relations: ['user'],
      });

      if (!session) {
        return null;
      }

      // Validate expiration
      if (new Date() > new Date(session.expiresAt)) {
        await this.invalidateSession(token);
        return null;
      }

      // Cache for future requests
      await this.cacheSession(session);

      return session;
    } catch (error) {
      this.logger.error('Failed to retrieve session:', error.message);

      // Attempt fallback to database if Redis fails
      try {
        return await this.sessionRepository.findOne({
          where: { token, isActive: true },
          relations: ['user'],
        });
      } catch (dbError) {
        this.logger.error('Database fallback failed:', dbError.message);
        throw error;
      }
    }
  }

  /**
   * Invalidate session (remove from both Redis and PostgreSQL)
   */
  async invalidateSession(token: string): Promise<void> {
    try {
      // Remove from Redis
      const cacheKey = this.getCacheKey(token);
      await this.redisClient.del(cacheKey);

      // Mark as inactive in database (don't delete for audit trail)
      await this.sessionRepository.update({ token }, { isActive: false });
    } catch (error) {
      this.logger.error('Failed to invalidate session:', error.message);
      throw error;
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      // Get all user sessions from database
      const sessions = await this.sessionRepository.find({
        where: { userId, isActive: true },
      });

      // Remove from Redis
      const cacheKeys = sessions.map((s) => this.getCacheKey(s.token));
      if (cacheKeys.length > 0) {
        await this.redisClient.del(...cacheKeys);
      }

      // Mark all as inactive in database
      await this.sessionRepository.update(
        { userId, isActive: true },
        { isActive: false },
      );
    } catch (error) {
      this.logger.error('Failed to invalidate all user sessions:', error.message);
      throw error;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Clean up expired sessions (for scheduled task)
   */
  async cleanupExpiredSessions(): Promise<void> {
    const expiredSessions = await this.sessionRepository.find({
      where: { isActive: true },
    });

    const now = new Date();
    const tokensToInvalidate = expiredSessions
      .filter((s) => new Date(s.expiresAt) < now)
      .map((s) => s.token);

    // Invalidate each expired session
    await Promise.all(
      tokensToInvalidate.map((token) => this.invalidateSession(token)),
    );
  }

  /**
   * Helper: Cache session in Redis
   */
  private async cacheSession(session: Session): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(session.token);
      const ttl = Math.floor(
        (new Date(session.expiresAt).getTime() - Date.now()) / 1000,
      );

      // Only cache if not expired
      if (ttl > 0) {
        // Serialize session data explicitly to ensure user relation is preserved
        const sessionData = {
          id: session.id,
          userId: session.userId,
          token: session.token,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          isActive: session.isActive,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          user: session.user ? {
            id: session.user.id,
            email: session.user.email,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            emailVerified: session.user.emailVerified,
            isActive: session.user.isActive,
            role: session.user.role,
            createdAt: session.user.createdAt,
            updatedAt: session.user.updatedAt,
            lastLoginAt: session.user.lastLoginAt,
            lastLoginIp: session.user.lastLoginIp,
            lastLoginUserAgent: session.user.lastLoginUserAgent,
          } : null,
        };

        const serialized = JSON.stringify(sessionData);
        await this.redisClient.setex(cacheKey, ttl, serialized);
      }
    } catch (error) {
      this.logger.warn('Failed to cache session:', error.message);
      // Don't throw - caching failure shouldn't break session creation
    }
  }

  /**
   * Helper: Generate cache key
   */
  private getCacheKey(token: string): string {
    return `${this.CACHE_KEY_PREFIX}${token}`;
  }
}
