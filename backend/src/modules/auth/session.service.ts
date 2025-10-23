import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Session } from '../../database/entities/session.entity';
import * as crypto from 'crypto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
  private readonly CACHE_KEY_PREFIX = 'session:';

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  /**
   * Create a new session (store in both Redis and PostgreSQL)
   */
  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    const startTime = Date.now();

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

      const duration = Date.now() - startTime;
      this.logger.log({
        event: 'session_created',
        userId,
        sessionId: savedSession.id,
        duration: `${duration}ms`,
        cached: true,
      });

      return savedSession;
    } catch (error) {
      this.logger.error({
        event: 'session_create_failed',
        userId,
        error: error.message,
        duration: `${Date.now() - startTime}ms`,
      });
      throw error;
    }
  }

  /**
   * Get session by token (Redis first, then PostgreSQL)
   */
  async getSession(token: string): Promise<Session | null> {
    const startTime = Date.now();

    try {
      // FAST PATH: Try Redis first
      const cacheKey = this.getCacheKey(token);
      const cachedSession = await this.cacheManager.get<Session>(cacheKey);

      if (cachedSession) {
        const duration = Date.now() - startTime;
        this.logger.debug({
          event: 'session_retrieved',
          source: 'redis',
          duration: `${duration}ms`,
          cacheHit: true,
        });

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

      const duration = Date.now() - startTime;

      if (!session) {
        this.logger.debug({
          event: 'session_not_found',
          duration: `${duration}ms`,
          cacheHit: false,
        });
        return null;
      }

      this.logger.debug({
        event: 'session_retrieved',
        source: 'database',
        duration: `${duration}ms`,
        cacheHit: false,
      });

      // Validate expiration
      if (new Date() > new Date(session.expiresAt)) {
        await this.invalidateSession(token);
        return null;
      }

      // Cache for future requests
      await this.cacheSession(session);

      return session;
    } catch (error) {
      this.logger.error({
        event: 'session_retrieval_failed',
        error: error.message,
        duration: `${Date.now() - startTime}ms`,
      });

      // Attempt fallback to database if Redis fails
      try {
        const session = await this.sessionRepository.findOne({
          where: { token, isActive: true },
          relations: ['user'],
        });

        if (session) {
          this.logger.warn({
            event: 'redis_fallback_success',
            message: 'Retrieved session from database after Redis failure',
          });
        }

        return session;
      } catch (dbError) {
        this.logger.error({
          event: 'session_retrieval_complete_failure',
          redisError: error.message,
          dbError: dbError.message,
        });
        throw error;
      }
    }
  }

  /**
   * Invalidate session (remove from both Redis and PostgreSQL)
   */
  async invalidateSession(token: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Remove from Redis
      const cacheKey = this.getCacheKey(token);
      await this.cacheManager.del(cacheKey);

      // Mark as inactive in database (don't delete for audit trail)
      await this.sessionRepository.update({ token }, { isActive: false });

      const duration = Date.now() - startTime;
      this.logger.log({
        event: 'session_invalidated',
        duration: `${duration}ms`,
      });
    } catch (error) {
      this.logger.error({
        event: 'session_invalidation_failed',
        error: error.message,
        duration: `${Date.now() - startTime}ms`,
      });
      throw error;
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Get all user sessions from database
      const sessions = await this.sessionRepository.find({
        where: { userId, isActive: true },
      });

      // Remove from Redis
      const cacheKeys = sessions.map((s) => this.getCacheKey(s.token));
      await Promise.all(cacheKeys.map((key) => this.cacheManager.del(key)));

      // Mark all as inactive in database
      await this.sessionRepository.update(
        { userId, isActive: true },
        { isActive: false },
      );

      const duration = Date.now() - startTime;
      this.logger.log({
        event: 'all_sessions_invalidated',
        userId,
        sessionCount: sessions.length,
        duration: `${duration}ms`,
      });
    } catch (error) {
      this.logger.error({
        event: 'bulk_invalidation_failed',
        userId,
        error: error.message,
        duration: `${Date.now() - startTime}ms`,
      });
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
        await this.cacheManager.set(cacheKey, session, ttl * 1000); // Convert to ms
        this.logger.debug({
          event: 'session_cached',
          sessionId: session.id,
          ttl: `${ttl}s`,
        });
      }
    } catch (error) {
      this.logger.warn({
        event: 'cache_set_failed',
        sessionId: session.id,
        error: error.message,
      });
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
