import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('conversion_fee_config')
@Index(['fromCurrency', 'toCurrency'], { unique: true })
export class ConversionFeeConfig extends BaseEntity {
  // Source currency (use "*" for wildcard to apply to all)
  @Column({ name: 'from_currency', type: 'varchar', length: 10 })
  fromCurrency: string;

  // Target currency (use "*" for wildcard to apply to all)
  @Column({ name: 'to_currency', type: 'varchar', length: 10 })
  toCurrency: string;

  // Percentage fee (e.g., 1.5 for 1.5%)
  @Column({
    name: 'percentage_fee',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Percentage fee to charge (e.g., 1.5 for 1.5%)'
  })
  percentageFee: number;

  // Fixed fee in source currency
  @Column({
    name: 'fixed_fee',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 0,
    comment: 'Fixed fee amount in source currency'
  })
  fixedFee: number;

  // Minimum fee (ensures fee doesn't go below this)
  @Column({
    name: 'minimum_fee',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 0,
    comment: 'Minimum fee to charge regardless of calculation'
  })
  minimumFee: number;

  // Rate markup/spread percentage (applied to exchange rate)
  @Column({
    name: 'rate_markup',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Markup percentage to add to exchange rate (e.g., 0.5 for 0.5%)'
  })
  rateMarkup: number;

  // Minimum conversion amount
  @Column({
    name: 'min_amount',
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true,
    comment: 'Minimum amount allowed for conversion in source currency'
  })
  minAmount: number | null;

  // Maximum conversion amount
  @Column({
    name: 'max_amount',
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true,
    comment: 'Maximum amount allowed for conversion in source currency'
  })
  maxAmount: number | null;

  // Note: isActive is inherited from BaseEntity

  // Priority for rule matching (higher priority = applied first)
  @Column({
    type: 'integer',
    default: 0,
    comment: 'Priority for matching rules. Specific pairs should have higher priority than wildcards'
  })
  priority: number;

  // Additional metadata
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional configuration metadata'
  })
  metadata: Record<string, any> | null;
}
