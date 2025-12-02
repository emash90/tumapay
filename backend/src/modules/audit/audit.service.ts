import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditEventType } from '../../database/entities/audit-log.entity';

export interface CreateAuditLogDto {
  userId?: string;
  businessId?: string;
  documentId?: string;
  email?: string;
  eventType: AuditEventType;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  description?: string;
  success?: boolean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Create an audit log entry
   */
  async log(data: CreateAuditLogDto): Promise<AuditLog | null> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: data.userId || null,
        businessId: data.businessId || null,
        documentId: data.documentId || null,
        email: data.email || null,
        eventType: data.eventType,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        metadata: data.metadata || null,
        description: data.description || null,
        success: data.success !== undefined ? data.success : true,
      });

      const savedLog = await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: ${data.eventType} for ${data.email || data.userId || 'unknown'}`,
      );

      return savedLog;
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw error - audit logging should not break the main flow
      return null;
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get audit logs by event type
   */
  async getAuditLogsByEventType(
    eventType: AuditEventType,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get failed audit logs (security monitoring)
   */
  async getFailedAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { success: false },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get audit logs for a specific business
   */
  async getBusinessAuditLogs(
    businessId: string,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get audit logs for a specific document
   */
  async getDocumentAuditLogs(
    documentId: string,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { documentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
