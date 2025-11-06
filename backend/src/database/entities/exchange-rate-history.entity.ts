import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('exchange_rate_history')
@Index(['fromCurrency', 'toCurrency', 'timestamp'])
@Index(['timestamp'])
export class ExchangeRateHistory extends BaseEntity {
  // Source currency
  @Column({ name: 'from_currency', type: 'varchar', length: 10 })
  fromCurrency: string;

  // Target currency
  @Column({ name: 'to_currency', type: 'varchar', length: 10 })
  toCurrency: string;

  // Exchange rate (1 FROM = rate TO)
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  rate: number;

  // Inverse rate (1 TO = inverseRate FROM)
  @Column({
    name: 'inverse_rate',
    type: 'decimal',
    precision: 18,
    scale: 8
  })
  inverseRate: number;

  // Unix timestamp from exchange rate provider
  @Column({
    type: 'bigint',
    comment: 'Unix timestamp from Fixer.io or other provider'
  })
  timestamp: number;

  // Source of the exchange rate
  @Column({
    type: 'varchar',
    length: 50,
    default: 'fixer',
    comment: 'Source of the exchange rate (fixer, manual, etc.)'
  })
  source: string;

  // Additional metadata from the rate provider
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional metadata from the rate provider'
  })
  metadata: Record<string, any> | null;
}
