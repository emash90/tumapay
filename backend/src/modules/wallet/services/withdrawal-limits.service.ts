import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Business, BusinessTier } from '../../../database/entities/business.entity';
import { Wallet } from '../../../database/entities/wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from '../../../database/entities/transaction.entity';

@Injectable()
export class WithdrawalLimitsService {
  private readonly logger = new Logger(WithdrawalLimitsService.name);

  // Withdrawal limits configuration
  private readonly MIN_WITHDRAWAL_AMOUNT: number;
  private readonly WITHDRAWAL_HOUR_START: number;
  private readonly WITHDRAWAL_HOUR_END: number;
  private readonly MAX_PENDING_WITHDRAWALS = 3;

  // Tier-based limits (per transaction)
  private readonly tierLimits = {
    [BusinessTier.BASIC]: {
      maxPerTransaction: 50000,
      dailyLimit: 100000,
    },
    [BusinessTier.PREMIUM]: {
      maxPerTransaction: 150000,
      dailyLimit: 500000,
    },
    [BusinessTier.ENTERPRISE]: {
      maxPerTransaction: 500000,
      dailyLimit: 2000000,
    },
  };

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private configService: ConfigService,
  ) {
    this.MIN_WITHDRAWAL_AMOUNT = this.configService.get<number>('WITHDRAWAL_MIN_AMOUNT', 10);
    this.WITHDRAWAL_HOUR_START = this.configService.get<number>('WITHDRAWAL_HOUR_START', 8);
    this.WITHDRAWAL_HOUR_END = this.configService.get<number>('WITHDRAWAL_HOUR_END', 22);
  }

  /**
   * Validate withdrawal request against all business rules
   */
  async validateWithdrawal(
    business: Business,
    wallet: Wallet,
    amount: number,
  ): Promise<void> {
    this.logger.log(
      `Validating withdrawal: ${amount} ${wallet.currency} for business ${business.id} (Tier: ${business.tier})`,
    );

    // 1. Minimum amount check
    this.validateMinimumAmount(amount);

    // 2. Maximum per transaction check (tier-based)
    this.validateMaxPerTransaction(amount, business.tier);

    // 3. Daily limit check
    await this.validateDailyLimit(business.id, amount, business.tier);

    // 4. Monthly limit check (use existing business monthly limit)
    await this.validateMonthlyLimit(business, amount);

    // 5. Pending withdrawals limit
    await this.validatePendingWithdrawalsLimit(business.id);

    // 6. Business hours check
    this.validateBusinessHours();

    this.logger.log(`Withdrawal validation passed for business ${business.id}`);
  }

  /**
   * Validate minimum withdrawal amount
   */
  private validateMinimumAmount(amount: number): void {
    if (amount < this.MIN_WITHDRAWAL_AMOUNT) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ${this.MIN_WITHDRAWAL_AMOUNT} KES`,
      );
    }
  }

  /**
   * Validate maximum per transaction based on tier
   */
  private validateMaxPerTransaction(amount: number, tier: BusinessTier): void {
    const maxAmount = this.tierLimits[tier].maxPerTransaction;

    if (amount > maxAmount) {
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
      throw new BadRequestException(
        `Maximum withdrawal for ${tierName} tier is ${maxAmount.toLocaleString()} KES per transaction. ` +
        `Upgrade to a higher tier for larger withdrawals.`,
      );
    }
  }

  /**
   * Validate daily withdrawal limit
   */
  private async validateDailyLimit(
    businessId: string,
    amount: number,
    tier: BusinessTier,
  ): Promise<void> {
    const dailyLimit = this.tierLimits[tier].dailyLimit;
    const dailyTotal = await this.getDailyWithdrawalTotal(businessId);

    if (dailyTotal + amount > dailyLimit) {
      const available = Math.max(0, dailyLimit - dailyTotal);
      throw new BadRequestException(
        `Daily withdrawal limit of ${dailyLimit.toLocaleString()} KES exceeded. ` +
        `You have withdrawn ${dailyTotal.toLocaleString()} KES today. ` +
        `Available: ${available.toLocaleString()} KES`,
      );
    }
  }

  /**
   * Validate monthly withdrawal limit (uses business.monthlyLimit)
   */
  private async validateMonthlyLimit(business: Business, amount: number): Promise<void> {
    const monthlyLimit = business.monthlyLimit;
    const monthlyTotal = await this.getMonthlyWithdrawalTotal(business.id);

    if (monthlyTotal + amount > monthlyLimit) {
      const available = Math.max(0, monthlyLimit - monthlyTotal);
      throw new BadRequestException(
        `Monthly withdrawal limit of ${monthlyLimit.toLocaleString()} KES exceeded. ` +
        `You have withdrawn ${monthlyTotal.toLocaleString()} KES this month. ` +
        `Available: ${available.toLocaleString()} KES`,
      );
    }
  }

  /**
   * Validate pending withdrawals limit
   */
  private async validatePendingWithdrawalsLimit(businessId: string): Promise<void> {
    const pendingCount = await this.getPendingWithdrawalCount(businessId);

    if (pendingCount >= this.MAX_PENDING_WITHDRAWALS) {
      throw new BadRequestException(
        `You have ${pendingCount} pending withdrawals. ` +
        `Maximum allowed is ${this.MAX_PENDING_WITHDRAWALS}. ` +
        `Please wait for them to complete before initiating a new withdrawal.`,
      );
    }
  }

  /**
   * Validate business hours (8 AM - 10 PM EAT)
   */
  private validateBusinessHours(): void {
    const now = new Date();
    const hour = now.getHours();

    if (hour < this.WITHDRAWAL_HOUR_START || hour >= this.WITHDRAWAL_HOUR_END) {
      throw new BadRequestException(
        `Withdrawals are only available between ${this.WITHDRAWAL_HOUR_START}:00 and ${this.WITHDRAWAL_HOUR_END}:00 EAT. ` +
        `Current time: ${hour}:${now.getMinutes().toString().padStart(2, '0')}`,
      );
    }
  }

  /**
   * Get total withdrawals for today
   */
  async getDailyWithdrawalTotal(businessId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.type = :type', { type: TransactionType.PAYOUT })
      .andWhere('t.walletId IS NOT NULL') // Only wallet withdrawals
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
      .andWhere('t.createdAt >= :today', { today })
      .andWhere('t.createdAt < :tomorrow', { tomorrow })
      .getRawOne();

    return Number(result?.total || 0);
  }

  /**
   * Get total withdrawals for current month
   */
  async getMonthlyWithdrawalTotal(businessId: string): Promise<number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.type = :type', { type: TransactionType.PAYOUT })
      .andWhere('t.walletId IS NOT NULL') // Only wallet withdrawals
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
      .andWhere('t.createdAt >= :start', { start: firstDayOfMonth })
      .andWhere('t.createdAt < :end', { end: firstDayOfNextMonth })
      .getRawOne();

    return Number(result?.total || 0);
  }

  /**
   * Get count of pending withdrawals
   */
  async getPendingWithdrawalCount(businessId: string): Promise<number> {
    return await this.transactionRepository.count({
      where: {
        businessId,
        type: TransactionType.PAYOUT,
        walletId: Not(IsNull()),
        status: TransactionStatus.PENDING,
      },
    });
  }

  /**
   * Get withdrawal limit info for a business
   */
  getWithdrawalLimits(tier: BusinessTier) {
    return {
      minimumAmount: this.MIN_WITHDRAWAL_AMOUNT,
      maximumPerTransaction: this.tierLimits[tier].maxPerTransaction,
      dailyLimit: this.tierLimits[tier].dailyLimit,
      maxPendingWithdrawals: this.MAX_PENDING_WITHDRAWALS,
      businessHours: {
        start: this.WITHDRAWAL_HOUR_START,
        end: this.WITHDRAWAL_HOUR_END,
      },
    };
  }
}
