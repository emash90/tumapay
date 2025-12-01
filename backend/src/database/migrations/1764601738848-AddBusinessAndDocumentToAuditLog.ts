import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessAndDocumentToAuditLog1764601738848 implements MigrationInterface {
    name = 'AddBusinessAndDocumentToAuditLog1764601738848'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "business_id" uuid`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "document_id" uuid`);
        await queryRunner.query(`DROP INDEX "public"."IDX_75b571d19c1512e99960ba0a26"`);
        await queryRunner.query(`ALTER TYPE "public"."audit_logs_event_type_enum" RENAME TO "audit_logs_event_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_event_type_enum" AS ENUM('PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'PASSWORD_RESET_FAILED', 'PASSWORD_CHANGED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'EMAIL_VERIFIED', 'ACCOUNT_CREATED', 'ACCOUNT_LOCKED', 'SESSION_INVALIDATED', 'TWO_FACTOR_CODE_SENT', 'TWO_FACTOR_SUCCESS', 'TWO_FACTOR_FAILED', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'DOCUMENT_REPLACED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'KYB_STATUS_CHANGED')`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "event_type" TYPE "public"."audit_logs_event_type_enum" USING "event_type"::"text"::"public"."audit_logs_event_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_event_type_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_950ae3a69f9849570f84b7084d" ON "audit_logs" ("business_id", "event_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_75b571d19c1512e99960ba0a26" ON "audit_logs" ("user_id", "event_type") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_75b571d19c1512e99960ba0a26"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_950ae3a69f9849570f84b7084d"`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_event_type_enum_old" AS ENUM('PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'PASSWORD_RESET_FAILED', 'PASSWORD_CHANGED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'EMAIL_VERIFIED', 'ACCOUNT_CREATED', 'ACCOUNT_LOCKED', 'SESSION_INVALIDATED', 'TWO_FACTOR_CODE_SENT', 'TWO_FACTOR_SUCCESS', 'TWO_FACTOR_FAILED', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED')`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "event_type" TYPE "public"."audit_logs_event_type_enum_old" USING "event_type"::"text"::"public"."audit_logs_event_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_event_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."audit_logs_event_type_enum_old" RENAME TO "audit_logs_event_type_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_75b571d19c1512e99960ba0a26" ON "audit_logs" ("user_id", "event_type") `);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "document_id"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "business_id"`);
    }

}
