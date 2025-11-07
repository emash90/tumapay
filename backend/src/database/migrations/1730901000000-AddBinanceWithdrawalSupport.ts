import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBinanceWithdrawalSupport1730901000000 implements MigrationInterface {
  name = 'AddBinanceWithdrawalSupport1730901000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create binance_withdrawals table
    await queryRunner.query(`
      CREATE TABLE "binance_withdrawals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "binance_withdrawal_id" varchar(100) NOT NULL,
        "business_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "transaction_id" uuid,
        "amount" decimal(18,8) NOT NULL,
        "asset" varchar(10) NOT NULL DEFAULT 'USDT',
        "address" varchar(255) NOT NULL,
        "network" varchar(20) NOT NULL,
        "status" integer NOT NULL DEFAULT 4,
        "tx_id" varchar(255),
        "transaction_fee" decimal(18,8),
        "apply_time" TIMESTAMP,
        "success_time" TIMESTAMP,
        "info" text,
        "binance_response" jsonb,
        "error_message" text,
        "check_count" integer NOT NULL DEFAULT 0,
        "last_checked_at" TIMESTAMP,
        CONSTRAINT "PK_binance_withdrawals" PRIMARY KEY ("id")
      )
    `);

    // Add comments for key columns
    await queryRunner.query(`
      COMMENT ON COLUMN "binance_withdrawals"."binance_withdrawal_id" IS 'Unique withdrawal ID from Binance API'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "binance_withdrawals"."status" IS 'Binance withdrawal status: 0=EMAIL_SENT, 1=CANCELLED, 2=AWAITING_APPROVAL, 3=REJECTED, 4=PROCESSING, 5=FAILURE, 6=COMPLETED'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "binance_withdrawals"."tx_id" IS 'Blockchain transaction ID (txId) after withdrawal is confirmed'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "binance_withdrawals"."transaction_fee" IS 'Fee charged by Binance for the withdrawal'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "binance_withdrawals"."apply_time" IS 'Time when withdrawal was created/applied'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "binance_withdrawals"."success_time" IS 'Time when withdrawal was completed on blockchain'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "binance_withdrawals"."binance_response" IS 'Full Binance API response for debugging purposes'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "binance_withdrawals"."check_count" IS 'Number of times status has been checked via polling'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "binance_withdrawals"."last_checked_at" IS 'Last time status was checked from Binance API'
    `);

    // Create unique index on binance_withdrawal_id
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_binance_withdrawals_binance_withdrawal_id" ON "binance_withdrawals" ("binance_withdrawal_id")
    `);

    // Create composite index for business queries
    await queryRunner.query(`
      CREATE INDEX "IDX_binance_withdrawals_business_id_created_at" ON "binance_withdrawals" ("business_id", "created_at")
    `);

    // Create index on status for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_binance_withdrawals_status" ON "binance_withdrawals" ("status")
    `);

    // Create index on tx_id for blockchain lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_binance_withdrawals_tx_id" ON "binance_withdrawals" ("tx_id")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "binance_withdrawals"
      ADD CONSTRAINT "FK_binance_withdrawals_business"
      FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "binance_withdrawals"
      ADD CONSTRAINT "FK_binance_withdrawals_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "binance_withdrawals"
      ADD CONSTRAINT "FK_binance_withdrawals_transaction"
      FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Add WITHDRAWAL type to transaction type enum
    await queryRunner.query(`
      ALTER TYPE "transactions_type_enum" ADD VALUE 'withdrawal'
    `);

    // Add binance_withdrawal_id column to transactions table
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN "binance_withdrawal_id" uuid
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "transactions"."binance_withdrawal_id" IS 'Link to Binance withdrawal record for USDT blockchain withdrawals'
    `);

    // Add index on binance_withdrawal_id for quick lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_transactions_binance_withdrawal_id" ON "transactions" ("binance_withdrawal_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index and column from transactions table
    await queryRunner.query(`
      DROP INDEX "IDX_transactions_binance_withdrawal_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN "binance_withdrawal_id"
    `);

    // Note: PostgreSQL doesn't support removing enum values directly
    // The 'withdrawal' value will remain in the enum during rollback

    // Remove foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "binance_withdrawals"
      DROP CONSTRAINT "FK_binance_withdrawals_transaction"
    `);

    await queryRunner.query(`
      ALTER TABLE "binance_withdrawals"
      DROP CONSTRAINT "FK_binance_withdrawals_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "binance_withdrawals"
      DROP CONSTRAINT "FK_binance_withdrawals_business"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_binance_withdrawals_tx_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_binance_withdrawals_status"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_binance_withdrawals_business_id_created_at"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_binance_withdrawals_binance_withdrawal_id"
    `);

    // Drop binance_withdrawals table
    await queryRunner.query(`
      DROP TABLE "binance_withdrawals"
    `);
  }
}
