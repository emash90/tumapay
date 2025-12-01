import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTwoFactorAuthType1764569361014 implements MigrationInterface {
    name = 'AddTwoFactorAuthType1764569361014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."verifications_type_enum" RENAME TO "verifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."verifications_type_enum" AS ENUM('email_verification', 'password_reset', 'phone_verification', 'two_factor_setup', 'two_factor_auth')`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "type" TYPE "public"."verifications_type_enum" USING "type"::"text"::"public"."verifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "type" SET DEFAULT 'email_verification'`);
        await queryRunner.query(`DROP TYPE "public"."verifications_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."verifications_type_enum_old" AS ENUM('email_verification', 'password_reset', 'phone_verification', 'two_factor_setup')`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "type" TYPE "public"."verifications_type_enum_old" USING "type"::"text"::"public"."verifications_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "type" SET DEFAULT 'email_verification'`);
        await queryRunner.query(`DROP TYPE "public"."verifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."verifications_type_enum_old" RENAME TO "verifications_type_enum"`);
    }

}
