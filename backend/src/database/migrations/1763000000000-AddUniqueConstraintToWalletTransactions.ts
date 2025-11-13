import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintToWalletTransactions1763000000000 implements MigrationInterface {
  name = 'AddUniqueConstraintToWalletTransactions1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unique partial index on transaction_id
    // Partial index only applies WHERE transaction_id IS NOT NULL
    // This prevents duplicate wallet credits for the same transaction
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_wallet_transactions_unique_transaction_id"
      ON "wallet_transactions" ("transaction_id")
      WHERE "transaction_id" IS NOT NULL
    `);

    await queryRunner.query(`
      COMMENT ON INDEX "IDX_wallet_transactions_unique_transaction_id" IS
      'Ensures a transaction can only be credited to a wallet once (idempotency)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the unique index
    await queryRunner.query(`
      DROP INDEX "public"."IDX_wallet_transactions_unique_transaction_id"
    `);
  }
}
