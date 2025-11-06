import { DataSource } from 'typeorm';
import { ConversionFeeConfig } from '../entities/conversion-fee-config.entity';

/**
 * Seed default conversion fee configurations
 * This sets up initial fee structures for currency conversions
 */
export async function seedConversionFeeConfigs(dataSource: DataSource): Promise<void> {
  const feeConfigRepository = dataSource.getRepository(ConversionFeeConfig);

  // Define default fee configurations
  const defaultConfigs = [
    {
      fromCurrency: 'KES',
      toCurrency: 'USDT',
      percentageFee: 1.0, // 1% fee
      fixedFee: 0,
      minimumFee: 10, // Minimum 10 KES fee
      rateMarkup: 0.5, // 0.5% markup on exchange rate
      minAmount: 100, // Minimum 100 KES
      maxAmount: 1000000, // Maximum 1M KES
      priority: 100, // High priority for specific pair
      metadata: {
        description: 'Standard KES to USDT conversion fee',
        createdBy: 'system',
      },
    },
    {
      fromCurrency: 'USDT',
      toCurrency: 'KES',
      percentageFee: 1.0, // 1% fee
      fixedFee: 0,
      minimumFee: 0.5, // Minimum 0.5 USDT fee
      rateMarkup: 0.5, // 0.5% markup on exchange rate
      minAmount: 1, // Minimum 1 USDT
      maxAmount: 10000, // Maximum 10K USDT
      priority: 100, // High priority for specific pair
      metadata: {
        description: 'Standard USDT to KES conversion fee',
        createdBy: 'system',
      },
    },
    {
      fromCurrency: 'USD',
      toCurrency: 'KES',
      percentageFee: 1.5, // 1.5% fee
      fixedFee: 0,
      minimumFee: 0.5, // Minimum 0.5 USD fee
      rateMarkup: 0.75, // 0.75% markup
      minAmount: 1, // Minimum 1 USD
      maxAmount: 10000, // Maximum 10K USD
      priority: 90,
      metadata: {
        description: 'Standard USD to KES conversion fee',
        createdBy: 'system',
      },
    },
    {
      fromCurrency: 'KES',
      toCurrency: 'USD',
      percentageFee: 1.5, // 1.5% fee
      fixedFee: 0,
      minimumFee: 10, // Minimum 10 KES fee
      rateMarkup: 0.75, // 0.75% markup
      minAmount: 100, // Minimum 100 KES
      maxAmount: 1000000, // Maximum 1M KES
      priority: 90,
      metadata: {
        description: 'Standard KES to USD conversion fee',
        createdBy: 'system',
      },
    },
    {
      fromCurrency: 'TRY',
      toCurrency: '*',
      percentageFee: 2.0, // 2% fee for TRY conversions
      fixedFee: 0,
      minimumFee: 1, // Minimum 1 TRY fee
      rateMarkup: 1.0, // 1% markup
      minAmount: 10, // Minimum 10 TRY
      maxAmount: 100000, // Maximum 100K TRY
      priority: 50, // Medium priority for wildcard
      metadata: {
        description: 'TRY to any currency conversion fee',
        createdBy: 'system',
      },
    },
    {
      fromCurrency: '*',
      toCurrency: 'TRY',
      percentageFee: 2.0, // 2% fee
      fixedFee: 0,
      minimumFee: 1, // Minimum 1 in source currency
      rateMarkup: 1.0, // 1% markup
      minAmount: null, // No minimum
      maxAmount: null, // No maximum
      priority: 50, // Medium priority for wildcard
      metadata: {
        description: 'Any currency to TRY conversion fee',
        createdBy: 'system',
      },
    },
    {
      fromCurrency: '*',
      toCurrency: '*',
      percentageFee: 1.5, // 1.5% default fee
      fixedFee: 0,
      minimumFee: 0, // No minimum for catch-all
      rateMarkup: 1.0, // 1% default markup
      minAmount: null, // No minimum
      maxAmount: null, // No maximum
      priority: 1, // Lowest priority - catch-all
      metadata: {
        description: 'Default conversion fee for any currency pair',
        createdBy: 'system',
      },
    },
  ];

  // Insert or update configurations
  for (const config of defaultConfigs) {
    const existing = await feeConfigRepository.findOne({
      where: {
        fromCurrency: config.fromCurrency,
        toCurrency: config.toCurrency,
      },
    });

    if (existing) {
      console.log(
        `Fee config already exists for ${config.fromCurrency} -> ${config.toCurrency}, skipping...`,
      );
      continue;
    }

    const feeConfig = feeConfigRepository.create({
      ...config,
      isActive: true,
    });

    await feeConfigRepository.save(feeConfig);
    console.log(
      `Created fee config: ${config.fromCurrency} -> ${config.toCurrency}`,
    );
  }

  console.log('✅ Conversion fee configurations seeded successfully');
}

/**
 * Run seeder independently
 */
export async function runConversionFeeConfigSeeder(): Promise<void> {
  const { DataSource: TypeOrmDataSource } = await import('typeorm');
  const { getDatabaseConfig } = await import('../../config/database.config');
  const { ConfigService } = await import('@nestjs/config');

  const configService = new ConfigService();
  const dbConfig = getDatabaseConfig(configService);

  const dataSource = new TypeOrmDataSource(dbConfig as any);

  try {
    await dataSource.initialize();
    console.log('Database connection initialized');

    await seedConversionFeeConfigs(dataSource);

    await dataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error running seeder:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runConversionFeeConfigSeeder();
}
