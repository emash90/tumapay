import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransferTimelineTable1731400000000 implements MigrationInterface {
  name = 'CreateTransferTimelineTable1731400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for timeline step status
    await queryRunner.query(`
      CREATE TYPE "transfer_timeline_status_enum" AS ENUM('success', 'failed', 'pending')
    `);

    // Create transfer_timeline table
    await queryRunner.query(`
      CREATE TABLE "transfer_timeline" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        "transaction_id" uuid NOT NULL,
        "step" varchar(100) NOT NULL,
        "status" "transfer_timeline_status_enum" NOT NULL DEFAULT 'success',
        "message" text,
        "metadata" jsonb,
        "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_transfer_timeline" PRIMARY KEY ("id")
      )
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE "transfer_timeline" IS 'Tracks step-by-step progress through multi-step cross-border transfer orchestration'
    `);

    // Add column comments
    await queryRunner.query(`
      COMMENT ON COLUMN "transfer_timeline"."transaction_id" IS 'Reference to main transaction record'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "transfer_timeline"."step" IS 'Step identifier (e.g., wallet_debited, tron_transfer_sent, transfer_completed)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "transfer_timeline"."status" IS 'Step status: success, failed, or pending'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "transfer_timeline"."message" IS 'Human-readable message about this step'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "transfer_timeline"."metadata" IS 'Additional context (amounts, rates, txHashes, error details, etc.)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "transfer_timeline"."timestamp" IS 'When this step occurred (separate from created_at for precision)'
    `);

    // Create index on transaction_id for lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_transfer_timeline_transaction_id"
      ON "transfer_timeline" ("transaction_id")
    `);

    // Create composite index for transaction timeline queries (ordered by time)
    await queryRunner.query(`
      CREATE INDEX "IDX_transfer_timeline_transaction_id_created_at"
      ON "transfer_timeline" ("transaction_id", "created_at")
    `);

    // Create index on step for specific step lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_transfer_timeline_step"
      ON "transfer_timeline" ("step")
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "transfer_timeline"
      ADD CONSTRAINT "FK_transfer_timeline_transaction"
      FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.query(`
      ALTER TABLE "transfer_timeline"
      DROP CONSTRAINT "FK_transfer_timeline_transaction"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_transfer_timeline_step"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_transfer_timeline_transaction_id_created_at"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_transfer_timeline_transaction_id"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE "transfer_timeline"
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE "transfer_timeline_status_enum"
    `);
  }
}
