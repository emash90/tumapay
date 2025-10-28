import { MigrationInterface, QueryRunner } from 'typeorm';

export class BusinessModulePhase11730000000000 implements MigrationInterface {
  name = 'BusinessModulePhase11730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add is_super_admin column to users table
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_super_admin" boolean NOT NULL DEFAULT false`,
    );

    // 2. Migrate existing role data to is_super_admin
    // Set is_super_admin = true for users with role 'super_admin'
    await queryRunner.query(
      `UPDATE "users" SET "is_super_admin" = true WHERE "role" = 'super_admin'`,
    );

    // 3. Drop the old role column
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role"`);

    // 4. Add kra_pin column to businesses table
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "kra_pin" character varying(20)`,
    );

    // 5. Create index on kra_pin
    await queryRunner.query(
      `CREATE INDEX "IDX_business_kra_pin" ON "businesses" ("kra_pin")`,
    );

    // 6. Ensure industry column is nullable (it should already be, but let's be explicit)
    await queryRunner.query(
      `ALTER TABLE "businesses" ALTER COLUMN "industry" DROP NOT NULL`,
    );

    // Note: The OneToOne relationship change is handled at the ORM level via JoinColumn
    // No database schema changes are needed for this since the foreign key column (business_id) remains the same
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remove kra_pin index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_business_kra_pin"`);

    // 2. Remove kra_pin column
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "kra_pin"`);

    // 3. Add back role column
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'business_staff'`,
    );

    // 4. Create the enum type for role (if it doesn't exist)
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "user_role_enum" AS ENUM('super_admin', 'business_owner', 'business_admin', 'business_staff');
       EXCEPTION
         WHEN duplicate_object THEN null;
       END $$;`,
    );

    // 5. Alter role column to use enum
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "user_role_enum" USING "role"::"user_role_enum"`,
    );

    // 6. Migrate is_super_admin back to role
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'super_admin' WHERE "is_super_admin" = true`,
    );

    // 7. Drop is_super_admin column
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "is_super_admin"`,
    );
  }
}
