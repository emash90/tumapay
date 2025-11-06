import { Injectable, Logger } from '@nestjs/common';
import { ConversionFeeConfig } from '../../../database/entities/conversion-fee-config.entity';
import { IFeeCalculation } from '../interfaces/fee-calculation.interface';

@Injectable()
export class FeeCalculationService {
  private readonly logger = new Logger(FeeCalculationService.name);

  /**
   * Calculate all fees for a conversion
   *
   * Fee calculation logic:
   * 1. Calculate percentage fee: sourceAmount * (percentageFee / 100)
   * 2. Add fixed fee
   * 3. Compare with minimum fee and take the maximum
   * 4. Apply rate markup to exchange rate: rate * (1 - rateMarkup / 100)
   *
   * @param sourceAmount Amount in source currency
   * @param exchangeRate Base exchange rate (1 source = X target)
   * @param feeConfig Fee configuration to apply
   * @returns Complete fee calculation breakdown
   */
  calculateFees(
    sourceAmount: number,
    exchangeRate: number,
    feeConfig: ConversionFeeConfig | Partial<ConversionFeeConfig>,
  ): IFeeCalculation {
    const percentageFee = Number(feeConfig.percentageFee || 0);
    const fixedFee = Number(feeConfig.fixedFee || 0);
    const minimumFee = Number(feeConfig.minimumFee || 0);
    const rateMarkup = Number(feeConfig.rateMarkup || 0);

    // Calculate percentage fee
    const percentageFeeAmount = (sourceAmount * percentageFee) / 100;

    // Calculate total fee (percentage + fixed)
    const calculatedFee = percentageFeeAmount + fixedFee;

    // Apply minimum fee (take the maximum of calculated vs minimum)
    const appliedFee = Math.max(calculatedFee, minimumFee);

    // Apply rate markup to exchange rate
    // Markup reduces the rate given to the user (our profit margin)
    // Example: 1% markup on rate 0.0075 = 0.0075 * (1 - 0.01) = 0.007425
    const effectiveRate = exchangeRate * (1 - rateMarkup / 100);

    const result: IFeeCalculation = {
      percentageFee: percentageFeeAmount,
      fixedFee,
      minimumFee,
      rateMarkup,
      appliedFee,
      totalFee: appliedFee,
      effectiveRate,
    };

    this.logger.debug(`Fee calculation: ${JSON.stringify(result)}`);

    return result;
  }

  /**
   * Calculate target amount after conversion and fees
   *
   * @param sourceAmount Amount in source currency
   * @param effectiveRate Exchange rate with markup applied
   * @param totalFee Total fee in source currency
   * @returns Target amount after conversion and fees
   */
  calculateTargetAmount(
    sourceAmount: number,
    effectiveRate: number,
    totalFee: number,
  ): number {
    // Deduct fee from source amount first
    const amountAfterFee = sourceAmount - totalFee;

    // Convert to target currency using effective rate
    const targetAmount = amountAfterFee * effectiveRate;

    return targetAmount;
  }

  /**
   * Calculate the effective exchange rate including all fees
   * This is the actual rate the user gets after all fees and markups
   *
   * @param sourceAmount Amount in source currency
   * @param finalTargetAmount Final amount in target currency
   * @returns Effective rate including all fees
   */
  calculateEffectiveRateWithFees(
    sourceAmount: number,
    finalTargetAmount: number,
  ): number {
    if (sourceAmount === 0) return 0;
    return finalTargetAmount / sourceAmount;
  }

  /**
   * Validate conversion amounts
   *
   * @param sourceAmount Source amount
   * @param totalFee Total fee charged
   * @returns Validation result
   */
  validateConversionAmounts(
    sourceAmount: number,
    totalFee: number,
  ): { valid: boolean; error?: string } {
    if (sourceAmount <= 0) {
      return {
        valid: false,
        error: 'Source amount must be positive',
      };
    }

    if (totalFee >= sourceAmount) {
      return {
        valid: false,
        error: 'Fee cannot be greater than or equal to source amount',
      };
    }

    if (totalFee < 0) {
      return {
        valid: false,
        error: 'Fee cannot be negative',
      };
    }

    return { valid: true };
  }
}
