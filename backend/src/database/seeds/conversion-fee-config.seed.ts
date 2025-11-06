import { DataSource } from 'typeorm';
import { ConversionFeeConfig } from '../entities/conversion-fee-config.entity';

/**
 * Seed data for Conversion Fee Configuration
 * Creates default fee rules for currency conversions
 */
export async function seedConversionFeeConfig(dataSource: DataSource): Promise<void> {
  const feeConfigRepository = dataSource.getRepository(ConversionFeeConfig);

  console.log('🌱 Seeding conversion fee configuration...');

  // Check if seed data already exists
  const existingCount = await feeConfigRepository.count();
  if (existingCount > 0) {
    console.log('⚠️  Conversion fee config already exists, skipping seed');
    return;
  }

  // Default wildcard rule (applies to all conversions if no specific rule matches)
  // Priority: 0 (lowest)
  const defaultWildcardConfig = feeConfigRepository.create({
    fromCurrency: '*',
    toCurrency: '*',
    percentageFee: 2.0, // 2% fee
    fixedFee: 0,
    minimumFee: 0,
    rateMarkup: 0.5, // 0.5% markup on exchange rate
    minAmount: 1, // Minimum 1 unit of source currency
    maxAmount: null, // No maximum
    isActive: true,
    priority: 0,
    metadata: {
      description: 'Default fee for all currency conversions',
      appliedTo: 'All currency pairs without specific rules',
    },
  });

  // Specific rule: KES to USD conversions
  // Priority: 100 (higher priority than wildcard)
  const kesUsdConfig = feeConfigRepository.create({
    fromCurrency: 'KES',
    toCurrency: 'USD',
    percentageFee: 1.5, // 1.5% fee (better rate than default)
    fixedFee: 0,
    minimumFee: 5, // Minimum fee of 5 KES
    rateMarkup: 0.3, // 0.3% markup
    minAmount: 100, // Minimum 100 KES
    maxAmount: 1000000, // Maximum 1,000,000 KES
    isActive: true,
    priority: 100,
    metadata: {
      description: 'Preferential rate for KES to USD conversions',
      notes: 'Lower fees for high-volume pair',
    },
  });

  // Specific rule: USD to KES conversions
  const usdKesConfig = feeConfigRepository.create({
    fromCurrency: 'USD',
    toCurrency: 'KES',
    percentageFee: 1.5,
    fixedFee: 0,
    minimumFee: 0.05, // Minimum fee of 5 cents
    rateMarkup: 0.3,
    minAmount: 1, // Minimum 1 USD
    maxAmount: 10000, // Maximum 10,000 USD
    isActive: true,
    priority: 100,
    metadata: {
      description: 'Preferential rate for USD to KES conversions',
    },
  });

  // Specific rule: KES to USDT (stablecoin)
  const kesUsdtConfig = feeConfigRepository.create({
    fromCurrency: 'KES',
    toCurrency: 'USDT',
    percentageFee: 1.8, // Slightly higher due to crypto
    fixedFee: 0,
    minimumFee: 10, // Minimum 10 KES
    rateMarkup: 0.4,
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    priority: 100,
    metadata: {
      description: 'KES to USDT stablecoin conversions',
      notes: 'Slightly higher fee for crypto conversions',
    },
  });

  // Specific rule: USDT to KES
  const usdtKesConfig = feeConfigRepository.create({
    fromCurrency: 'USDT',
    toCurrency: 'KES',
    percentageFee: 1.8,
    fixedFee: 0,
    minimumFee: 0.1, // Minimum 0.1 USDT
    rateMarkup: 0.4,
    minAmount: 1,
    maxAmount: 5000,
    isActive: true,
    priority: 100,
    metadata: {
      description: 'USDT to KES conversions',
    },
  });

  // Specific rule: USD to USDT (should be nearly 1:1)
  const usdUsdtConfig = feeConfigRepository.create({
    fromCurrency: 'USD',
    toCurrency: 'USDT',
    percentageFee: 0.5, // Low fee for stablecoin pair
    fixedFee: 0,
    minimumFee: 0.01,
    rateMarkup: 0.1, // Minimal markup
    minAmount: 1,
    maxAmount: 10000,
    isActive: true,
    priority: 100,
    metadata: {
      description: 'USD to USDT conversions (near 1:1)',
    },
  });

  // Specific rule: USDT to USD
  const usdtUsdConfig = feeConfigRepository.create({
    fromCurrency: 'USDT',
    toCurrency: 'USD',
    percentageFee: 0.5,
    fixedFee: 0,
    minimumFee: 0.01,
    rateMarkup: 0.1,
    minAmount: 1,
    maxAmount: 10000,
    isActive: true,
    priority: 100,
    metadata: {
      description: 'USDT to USD conversions (near 1:1)',
    },
  });

  // Specific rule: TRY to EUR (Turkish Lira to Euro)
  const tryEurConfig = feeConfigRepository.create({
    fromCurrency: 'TRY',
    toCurrency: 'EUR',
    percentageFee: 1.2,
    fixedFee: 0,
    minimumFee: 1, // 1 TRY minimum
    rateMarkup: 0.3,
    minAmount: 10,
    maxAmount: 100000,
    isActive: true,
    priority: 100,
    metadata: {
      description: 'TRY to EUR conversions',
    },
  });

  // Wildcard rule: Any currency to KES
  // Priority: 50 (medium - higher than default but lower than specific pairs)
  const toKesConfig = feeConfigRepository.create({
    fromCurrency: '*',
    toCurrency: 'KES',
    percentageFee: 1.7,
    fixedFee: 0,
    minimumFee: 0,
    rateMarkup: 0.4,
    minAmount: null,
    maxAmount: null,
    isActive: true,
    priority: 50,
    metadata: {
      description: 'Any currency to KES conversions',
      notes: 'Applied when no specific pair rule exists',
    },
  });

  // Wildcard rule: KES to any currency
  const fromKesConfig = feeConfigRepository.create({
    fromCurrency: 'KES',
    toCurrency: '*',
    percentageFee: 1.7,
    fixedFee: 0,
    minimumFee: 5,
    rateMarkup: 0.4,
    minAmount: 50,
    maxAmount: null,
    isActive: true,
    priority: 50,
    metadata: {
      description: 'KES to any currency conversions',
      notes: 'Applied when no specific pair rule exists',
    },
  });

  // Save all configs
  await feeConfigRepository.save([
    defaultWildcardConfig,
    kesUsdConfig,
    usdKesConfig,
    kesUsdtConfig,
    usdtKesConfig,
    usdUsdtConfig,
    usdtUsdConfig,
    tryEurConfig,
    toKesConfig,
    fromKesConfig,
  ]);

  console.log('✅ Created 10 conversion fee configurations:');
  console.log('   - 1 default wildcard rule (*→*)');
  console.log('   - 6 specific currency pair rules');
  console.log('   - 2 wildcard rules for KES conversions');
  console.log('   - 1 TRY→EUR rule');
}
