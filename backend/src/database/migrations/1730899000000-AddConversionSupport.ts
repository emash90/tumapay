import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversionSupport1730899000000 implements MigrationInterface {
  name = 'AddConversionSupport1730899000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ExchangeRateHistory table
    await queryRunner.query(`
      CREATE TABLE "exchange_rate_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "from_currency" varchar(10) NOT NULL,
        "to_currency" varchar(10) NOT NULL,
        "rate" decimal(18,8) NOT NULL,
        "inverse_rate" decimal(18,8) NOT NULL,
        "timestamp" bigint NOT NULL,
        "source" varchar(50) NOT NULL DEFAULT 'fixer',
        "metadata" jsonb,
        CONSTRAINT "PK_exchange_rate_history" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "exchange_rate_history"."timestamp" IS 'Unix timestamp from Fixer.io or other provider'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "exchange_rate_history"."source" IS 'Source of the exchange rate (fixer, manual, etc.)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "exchange_rate_history"."metadata" IS 'Additional metadata from the rate provider'
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_exchange_rate_history_from_to_timestamp" ON "exchange_rate_history" ("from_currency", "to_currency", "timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_exchange_rate_history_timestamp" ON "exchange_rate_history" ("timestamp")
    `);

    // Create ConversionFeeConfig table
    await queryRunner.query(`
      CREATE TABLE "conversion_fee_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "from_currency" varchar(10) NOT NULL,
        "to_currency" varchar(10) NOT NULL,
        "percentage_fee" decimal(5,2) NOT NULL DEFAULT '0',
        "fixed_fee" decimal(18,8) NOT NULL DEFAULT '0',
        "minimum_fee" decimal(18,8) NOT NULL DEFAULT '0',
        "rate_markup" decimal(5,2) NOT NULL DEFAULT '0',
        "min_amount" decimal(18,8),
        "max_amount" decimal(18,8),
        "is_active" boolean NOT NULL DEFAULT true,
        "priority" integer NOT NULL DEFAULT '0',
        "metadata" jsonb,
        CONSTRAINT "PK_conversion_fee_config" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "conversion_fee_config"."percentage_fee" IS 'Percentage fee to charge (e.g., 1.5 for 1.5%)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "conversion_fee_config"."fixed_fee" IS 'Fixed fee amount in source currency'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "conversion_fee_config"."minimum_fee" IS 'Minimum fee to charge regardless of calculation'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "conversion_fee_config"."rate_markup" IS 'Markup percentage to add to exchange rate (e.g., 0.5 for 0.5%)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "conversion_fee_config"."min_amount" IS 'Minimum amount allowed for conversion in source currency'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "conversion_fee_config"."max_amount" IS 'Maximum amount allowed for conversion in source currency'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "conversion_fee_config"."is_active" IS 'Whether this fee configuration is currently active'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "conversion_fee_config"."priority" IS 'Priority for matching rules. Specific pairs should have higher priority than wildcards'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "conversion_fee_config"."metadata" IS 'Additional configuration metadata'
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_conversion_fee_config_from_to" ON "conversion_fee_config" ("from_currency", "to_currency")
    `);

    // Add CONVERSION type to transaction type enum
    await queryRunner.query(`
      ALTER TYPE "transactions_type_enum" ADD VALUE 'conversion'
    `);

    // Add conversion fields to transactions table
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN "source_currency" varchar(10),
      ADD COLUMN "target_currency" varchar(10),
      ADD COLUMN "source_amount" decimal(18,8),
      ADD COLUMN "target_amount" decimal(18,8),
      ADD COLUMN "exchange_rate" decimal(18,8),
      ADD COLUMN "conversion_fee" decimal(18,8) DEFAULT 0,
      ADD COLUMN "rate_timestamp" bigint,
      ADD COLUMN "source_wallet_id" uuid,
      ADD COLUMN "target_wallet_id" uuid
    `);

    // Add foreign key constraints for source and target wallets
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD CONSTRAINT "FK_transactions_source_wallet"
      FOREIGN KEY ("source_wallet_id") REFERENCES "wallets"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD CONSTRAINT "FK_transactions_target_wallet"
      FOREIGN KEY ("target_wallet_id") REFERENCES "wallets"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Update wallet_transactions type enum - rename CONVERSION to CONVERSION_DEBIT and add CONVERSION_CREDIT
    await queryRunner.query(`
      ALTER TYPE "wallet_transactions_type_enum" RENAME VALUE 'conversion' TO 'conversion_debit'
    `);

    await queryRunner.query(`
      ALTER TYPE "wallet_transactions_type_enum" ADD VALUE 'conversion_credit'
    `);

    // Add conversion fields to wallet_transactions table
    await queryRunner.query(`
      ALTER TABLE "wallet_transactions"
      ADD COLUMN "conversion_id" uuid,
      ADD COLUMN "exchange_rate" decimal(18,8)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove conversion fields from wallet_transactions
    await queryRunner.query(`
      ALTER TABLE "wallet_transactions"
      DROP COLUMN "exchange_rate",
      DROP COLUMN "conversion_id"
    `);

    // Note: PostgreSQL doesn't support removing enum values directly
    // You would need to recreate the enum type to remove values
    // For simplicity, we're leaving the enum values in place during rollback

    // Remove foreign key constraints and conversion fields from transactions
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP CONSTRAINT "FK_transactions_target_wallet"
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP CONSTRAINT "FK_transactions_source_wallet"
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN "target_wallet_id",
      DROP COLUMN "source_wallet_id",
      DROP COLUMN "rate_timestamp",
      DROP COLUMN "conversion_fee",
      DROP COLUMN "exchange_rate",
      DROP COLUMN "target_amount",
      DROP COLUMN "source_amount",
      DROP COLUMN "target_currency",
      DROP COLUMN "source_currency"
    `);

    // Drop ConversionFeeConfig table
    await queryRunner.query(`
      DROP INDEX "IDX_conversion_fee_config_from_to"
    `);

    await queryRunner.query(`
      DROP TABLE "conversion_fee_config"
    `);

    // Drop ExchangeRateHistory table
    await queryRunner.query(`
      DROP INDEX "IDX_exchange_rate_history_timestamp"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_exchange_rate_history_from_to_timestamp"
    `);

    await queryRunner.query(`
      DROP TABLE "exchange_rate_history"
    `);
  }
}
