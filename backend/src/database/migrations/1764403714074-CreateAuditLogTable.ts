import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditLogTable1764403714074 implements MigrationInterface {
    name = 'CreateAuditLogTable1764403714074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_event_type_enum" AS ENUM('PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'PASSWORD_RESET_FAILED', 'PASSWORD_CHANGED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'EMAIL_VERIFIED', 'ACCOUNT_CREATED', 'ACCOUNT_LOCKED', 'SESSION_INVALIDATED')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "user_id" uuid, "email" character varying(255), "event_type" "public"."audit_logs_event_type_enum" NOT NULL, "ip_address" character varying(100), "user_agent" character varying(500), "metadata" jsonb, "description" text, "success" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2cd10fda8276bb995288acfbfb" ON "audit_logs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_75b571d19c1512e99960ba0a26" ON "audit_logs" ("user_id", "event_type") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_75b571d19c1512e99960ba0a26"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2cd10fda8276bb995288acfbfb"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_event_type_enum"`);
    }

}
