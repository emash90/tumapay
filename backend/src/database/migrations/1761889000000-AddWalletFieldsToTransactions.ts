import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWalletFieldsToTransactions1761889000000 implements MigrationInterface {
  name = 'AddWalletFieldsToTransactions1761889000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add wallet_id column to transactions table
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN "wallet_id" uuid
    `);

    // Add wallet_currency column to transactions table
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN "wallet_currency" character varying(10)
    `);

    // Add foreign key constraint for wallet_id
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e"
      FOREIGN KEY ("wallet_id")
      REFERENCES "wallets"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e"
    `);

    // Drop wallet_currency column
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN "wallet_currency"
    `);

    // Drop wallet_id column
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN "wallet_id"
    `);
  }
}
