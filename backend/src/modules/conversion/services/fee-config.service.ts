import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversionFeeConfig } from '../../../database/entities/conversion-fee-config.entity';

@Injectable()
export class FeeConfigService {
  private readonly logger = new Logger(FeeConfigService.name);

  constructor(
    @InjectRepository(ConversionFeeConfig)
    private feeConfigRepository: Repository<ConversionFeeConfig>,
  ) {}

  /**
   * Find the best matching fee configuration for a currency pair
   * Priority order:
   * 1. Exact match (from-to)
   * 2. Wildcard target (from-*)
   * 3. Wildcard source (*-to)
   * 4. Double wildcard (*-*)
   * 5. Default (no config found)
   */
  async findFeeConfig(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<ConversionFeeConfig | null> {
    // Get all active fee configs ordered by priority (descending)
    const allConfigs = await this.feeConfigRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC' },
    });

    // Try to find exact match
    let match = allConfigs.find(
      (config) =>
        config.fromCurrency === fromCurrency &&
        config.toCurrency === toCurrency,
    );

    if (match) {
      this.logger.debug(
        `Found exact match fee config for ${fromCurrency}->${toCurrency}`,
      );
      return match;
    }

    // Try to find wildcard target (from-*)
    match = allConfigs.find(
      (config) =>
        config.fromCurrency === fromCurrency && config.toCurrency === '*',
    );

    if (match) {
      this.logger.debug(
        `Found wildcard target fee config for ${fromCurrency}->*`,
      );
      return match;
    }

    // Try to find wildcard source (*-to)
    match = allConfigs.find(
      (config) =>
        config.fromCurrency === '*' && config.toCurrency === toCurrency,
    );

    if (match) {
      this.logger.debug(
        `Found wildcard source fee config for *->${toCurrency}`,
      );
      return match;
    }

    // Try to find double wildcard (*-*)
    match = allConfigs.find(
      (config) => config.fromCurrency === '*' && config.toCurrency === '*',
    );

    if (match) {
      this.logger.debug(`Found double wildcard fee config for *->*`);
      return match;
    }

    this.logger.debug(
      `No fee config found for ${fromCurrency}->${toCurrency}`,
    );
    return null;
  }

  /**
   * Get default fee configuration
   * Returns zero fees if no default is configured
   */
  getDefaultFeeConfig(): Partial<ConversionFeeConfig> {
    return {
      percentageFee: 0,
      fixedFee: 0,
      minimumFee: 0,
      rateMarkup: 0,
      minAmount: null,
      maxAmount: null,
    };
  }

  /**
   * Create or update fee configuration
   */
  async upsertFeeConfig(
    fromCurrency: string,
    toCurrency: string,
    config: Partial<ConversionFeeConfig>,
  ): Promise<ConversionFeeConfig> {
    // Remove fromCurrency and toCurrency from config to prevent updating unique keys
    const { fromCurrency: _, toCurrency: __, ...updateConfig } = config as any;

    // Check if config exists
    let feeConfig = await this.feeConfigRepository.findOne({
      where: { fromCurrency, toCurrency },
    });

    if (feeConfig) {
      // Update existing - explicitly set each field to ensure proper type conversion
      if (updateConfig.percentageFee !== undefined) {
        feeConfig.percentageFee = Number(updateConfig.percentageFee);
      }
      if (updateConfig.fixedFee !== undefined) {
        feeConfig.fixedFee = Number(updateConfig.fixedFee);
      }
      if (updateConfig.minimumFee !== undefined) {
        feeConfig.minimumFee = Number(updateConfig.minimumFee);
      }
      if (updateConfig.rateMarkup !== undefined) {
        feeConfig.rateMarkup = Number(updateConfig.rateMarkup);
      }
      if (updateConfig.minAmount !== undefined) {
        feeConfig.minAmount = updateConfig.minAmount !== null ? Number(updateConfig.minAmount) : null;
      }
      if (updateConfig.maxAmount !== undefined) {
        feeConfig.maxAmount = updateConfig.maxAmount !== null ? Number(updateConfig.maxAmount) : null;
      }
      if (updateConfig.priority !== undefined) {
        feeConfig.priority = Number(updateConfig.priority);
      }
      if (updateConfig.isActive !== undefined) {
        feeConfig.isActive = Boolean(updateConfig.isActive);
      }
      if (updateConfig.metadata !== undefined) {
        feeConfig.metadata = updateConfig.metadata;
      }

      this.logger.log(`Updating fee config for ${fromCurrency}->${toCurrency}`);
    } else {
      // Create new
      feeConfig = this.feeConfigRepository.create({
        fromCurrency,
        toCurrency,
        percentageFee: Number(updateConfig.percentageFee || 0),
        fixedFee: Number(updateConfig.fixedFee || 0),
        minimumFee: Number(updateConfig.minimumFee || 0),
        rateMarkup: Number(updateConfig.rateMarkup || 0),
        minAmount: updateConfig.minAmount !== undefined ? Number(updateConfig.minAmount) : null,
        maxAmount: updateConfig.maxAmount !== undefined ? Number(updateConfig.maxAmount) : null,
        priority: Number(updateConfig.priority || 0),
        metadata: updateConfig.metadata || null,
        isActive: true,
      });
      this.logger.log(`Creating fee config for ${fromCurrency}->${toCurrency}`);
    }

    return await this.feeConfigRepository.save(feeConfig);
  }

  /**
   * Get all fee configurations
   */
  async getAllFeeConfigs(activeOnly = true): Promise<ConversionFeeConfig[]> {
    const where = activeOnly ? { isActive: true } : {};
    return await this.feeConfigRepository.find({
      where,
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Delete fee configuration
   */
  async deleteFeeConfig(id: string): Promise<void> {
    await this.feeConfigRepository.delete(id);
    this.logger.log(`Deleted fee config: ${id}`);
  }

  /**
   * Validate amount against min/max limits
   */
  validateAmount(
    amount: number,
    config: ConversionFeeConfig | Partial<ConversionFeeConfig>,
  ): { valid: boolean; error?: string } {
    if (config.minAmount !== null && config.minAmount !== undefined) {
      if (amount < Number(config.minAmount)) {
        return {
          valid: false,
          error: `Amount ${amount} is below minimum ${config.minAmount}`,
        };
      }
    }

    if (config.maxAmount !== null && config.maxAmount !== undefined) {
      if (amount > Number(config.maxAmount)) {
        return {
          valid: false,
          error: `Amount ${amount} exceeds maximum ${config.maxAmount}`,
        };
      }
    }

    return { valid: true };
  }
}
