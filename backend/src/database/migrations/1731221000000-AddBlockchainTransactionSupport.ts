import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlockchainTransactionSupport1731221000000 implements MigrationInterface {
  name = 'AddBlockchainTransactionSupport1731221000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for blockchain network and status
    await queryRunner.query(`
      CREATE TYPE "blockchain_network_enum" AS ENUM('TRON', 'ETHEREUM', 'BSC', 'POLYGON')
    `);

    await queryRunner.query(`
      CREATE TYPE "blockchain_transaction_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'FAILED')
    `);

    // Create blockchain_transactions table
    await queryRunner.query(`
      CREATE TABLE "blockchain_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        "transaction_id" uuid NOT NULL,
        "business_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "network" "blockchain_network_enum" NOT NULL,
        "currency" varchar(10) NOT NULL DEFAULT 'USDT',
        "amount" decimal(18,8) NOT NULL,
        "from_address" varchar(255) NOT NULL,
        "to_address" varchar(255) NOT NULL,
        "tx_hash" varchar(255),
        "status" "blockchain_transaction_status_enum" NOT NULL DEFAULT 'PENDING',
        "confirmations" integer NOT NULL DEFAULT 0,
        "block_number" bigint,
        "gas_fee" decimal(18,8),
        "gas_price" bigint,
        "gas_limit" bigint,
        "energy_used" bigint,
        "bandwidth_used" integer,
        "broadcasted_at" TIMESTAMP,
        "confirmed_at" TIMESTAMP,
        "failed_at" TIMESTAMP,
        "error_message" text,
        "metadata" jsonb,
        "check_count" integer NOT NULL DEFAULT 0,
        "last_checked_at" TIMESTAMP,
        "retry_count" integer NOT NULL DEFAULT 0,
        "last_retry_at" TIMESTAMP,
        CONSTRAINT "PK_blockchain_transactions" PRIMARY KEY ("id")
      )
    `);

    // Add comments for key columns
    await queryRunner.query(`
      COMMENT ON TABLE "blockchain_transactions" IS 'Tracks blockchain transactions for cryptocurrency transfers (USDT, TRX, ETH, etc.)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."transaction_id" IS 'Reference to main transaction record for accounting'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."network" IS 'Blockchain network: TRON, ETHEREUM, BSC, POLYGON'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."currency" IS 'Cryptocurrency symbol (USDT, TRX, ETH, BNB, etc.)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."amount" IS 'Transaction amount in cryptocurrency units'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."from_address" IS 'Sender blockchain address (our platform wallet)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."to_address" IS 'Recipient blockchain address (customer/partner wallet)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."tx_hash" IS 'Unique blockchain transaction hash - primary identifier on blockchain'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."status" IS 'Transaction status: PENDING, CONFIRMED, FAILED'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."confirmations" IS 'Number of block confirmations (19+ for TRON solid block)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."block_number" IS 'Block number where transaction was included'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."gas_fee" IS 'Transaction fee paid in native currency (TRX, ETH, BNB)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."energy_used" IS 'Energy consumed (TRON-specific metric)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."bandwidth_used" IS 'Bandwidth consumed (TRON-specific metric)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."metadata" IS 'Additional data: raw blockchain responses, extra parameters'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."check_count" IS 'Number of status check attempts via blockchain API'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "blockchain_transactions"."last_checked_at" IS 'Last time status was checked from blockchain'
    `);

    // Create unique index on tx_hash
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_blockchain_transactions_tx_hash"
      ON "blockchain_transactions" ("tx_hash")
      WHERE "tx_hash" IS NOT NULL
    `);

    // Create index on transaction_id for linking to main transactions
    await queryRunner.query(`
      CREATE INDEX "IDX_blockchain_transactions_transaction_id"
      ON "blockchain_transactions" ("transaction_id")
    `);

    // Create composite index for business queries
    await queryRunner.query(`
      CREATE INDEX "IDX_blockchain_transactions_business_id_created_at"
      ON "blockchain_transactions" ("business_id", "created_at")
    `);

    // Create composite index for status filtering by network
    await queryRunner.query(`
      CREATE INDEX "IDX_blockchain_transactions_status_network"
      ON "blockchain_transactions" ("status", "network")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "blockchain_transactions"
      ADD CONSTRAINT "FK_blockchain_transactions_transaction"
      FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "blockchain_transactions"
      ADD CONSTRAINT "FK_blockchain_transactions_business"
      FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "blockchain_transactions"
      ADD CONSTRAINT "FK_blockchain_transactions_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`
      ALTER TABLE "blockchain_transactions"
      DROP CONSTRAINT "FK_blockchain_transactions_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "blockchain_transactions"
      DROP CONSTRAINT "FK_blockchain_transactions_business"
    `);

    await queryRunner.query(`
      ALTER TABLE "blockchain_transactions"
      DROP CONSTRAINT "FK_blockchain_transactions_transaction"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_blockchain_transactions_status_network"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_blockchain_transactions_business_id_created_at"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_blockchain_transactions_transaction_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_blockchain_transactions_tx_hash"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE "blockchain_transactions"
    `);

    // Drop enum types
    await queryRunner.query(`
      DROP TYPE "blockchain_transaction_status_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "blockchain_network_enum"
    `);
  }
}
