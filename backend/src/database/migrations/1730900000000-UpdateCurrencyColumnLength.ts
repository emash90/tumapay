import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCurrencyColumnLength1730900000000 implements MigrationInterface {
  name = 'UpdateCurrencyColumnLength1730900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update currency column length to support crypto currency codes like USDT
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ALTER COLUMN "currency" TYPE varchar(10)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "transactions"."currency" IS 'Currency code (e.g., KES, USD, EUR, USDT)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert currency column length back to 3
    // WARNING: This may fail if there are USDT or other 4+ character currency codes in the database
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ALTER COLUMN "currency" TYPE varchar(3)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "transactions"."currency" IS 'Currency code (e.g., KES, USD, EUR)'
    `);
  }
}
