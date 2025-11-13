import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferTimeline } from '../../../database/entities/transfer-timeline.entity';

/**
 * TransferTimelineService
 *
 * Manages step-by-step tracking of transfer orchestration progress
 * Provides methods to record, query, and analyze transfer timeline events
 */
@Injectable()
export class TransferTimelineService {
  private readonly logger = new Logger(TransferTimelineService.name);

  constructor(
    @InjectRepository(TransferTimeline)
    private timelineRepository: Repository<TransferTimeline>,
  ) {}

  /**
   * Record a step in the transfer timeline
   *
   * @param transactionId - Transaction ID to track
   * @param step - Step identifier (e.g., 'wallet_debited', 'tron_transfer_sent')
   * @param metadata - Additional context (amounts, rates, txHashes, etc.)
   * @param status - Step status (success, failed, or pending)
   * @param message - Optional human-readable message
   * @returns Created timeline entry
   */
  async recordStep(
    transactionId: string,
    step: string,
    metadata?: Record<string, any>,
    status: 'success' | 'failed' | 'pending' = 'success',
    message?: string,
  ): Promise<TransferTimeline> {
    const timeline = this.timelineRepository.create({
      transactionId,
      step,
      status,
      message,
      metadata,
      timestamp: new Date(),
    });

    const saved = await this.timelineRepository.save(timeline);

    this.logger.log(`Timeline step recorded: ${step} (${status}) for transaction ${transactionId}`);

    return saved;
  }

  /**
   * Get full timeline for a transaction (ordered by timestamp)
   *
   * @param transactionId - Transaction ID
   * @param businessId - Optional business ID for isolation check
   * @returns Array of timeline entries
   */
  async getTimeline(
    transactionId: string,
    businessId?: string,
  ): Promise<TransferTimeline[]> {
    const query = this.timelineRepository
      .createQueryBuilder('timeline')
      .where('timeline.transactionId = :transactionId', { transactionId })
      .orderBy('timeline.timestamp', 'ASC');

    // Optional: Add business isolation check
    if (businessId) {
      query
        .innerJoin('timeline.transaction', 'transaction')
        .andWhere('transaction.businessId = :businessId', { businessId });
    }

    return await query.getMany();
  }

  /**
   * Get current step (most recent) for a transaction
   *
   * @param transactionId - Transaction ID
   * @returns Most recent timeline entry or null
   */
  async getCurrentStep(transactionId: string): Promise<TransferTimeline | null> {
    return await this.timelineRepository.findOne({
      where: { transactionId },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Get all failed steps for a transaction
   *
   * @param transactionId - Transaction ID
   * @returns Array of failed timeline entries
   */
  async getFailedSteps(transactionId: string): Promise<TransferTimeline[]> {
    return await this.timelineRepository.find({
      where: {
        transactionId,
        status: 'failed',
      },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Check if a specific step has been completed successfully
   *
   * @param transactionId - Transaction ID
   * @param step - Step identifier to check
   * @returns true if step completed successfully, false otherwise
   */
  async hasStepCompleted(transactionId: string, step: string): Promise<boolean> {
    const count = await this.timelineRepository.count({
      where: {
        transactionId,
        step,
        status: 'success',
      },
    });
    return count > 0;
  }

  /**
   * Get all pending steps for a transaction
   *
   * @param transactionId - Transaction ID
   * @returns Array of pending timeline entries
   */
  async getPendingSteps(transactionId: string): Promise<TransferTimeline[]> {
    return await this.timelineRepository.find({
      where: {
        transactionId,
        status: 'pending',
      },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Get timeline summary (count of steps by status)
   *
   * @param transactionId - Transaction ID
   * @returns Object with counts by status
   */
  async getTimelineSummary(transactionId: string): Promise<{
    total: number;
    success: number;
    failed: number;
    pending: number;
  }> {
    const timeline = await this.getTimeline(transactionId);

    return {
      total: timeline.length,
      success: timeline.filter((t) => t.status === 'success').length,
      failed: timeline.filter((t) => t.status === 'failed').length,
      pending: timeline.filter((t) => t.status === 'pending').length,
    };
  }

  /**
   * Check if any step has failed
   *
   * @param transactionId - Transaction ID
   * @returns true if any step has failed, false otherwise
   */
  async hasAnyStepFailed(transactionId: string): Promise<boolean> {
    const count = await this.timelineRepository.count({
      where: {
        transactionId,
        status: 'failed',
      },
    });
    return count > 0;
  }

  /**
   * Get step by name (most recent occurrence)
   *
   * @param transactionId - Transaction ID
   * @param step - Step identifier
   * @returns Timeline entry or null
   */
  async getStep(transactionId: string, step: string): Promise<TransferTimeline | null> {
    return await this.timelineRepository.findOne({
      where: {
        transactionId,
        step,
      },
      order: { timestamp: 'DESC' },
    });
  }
}
