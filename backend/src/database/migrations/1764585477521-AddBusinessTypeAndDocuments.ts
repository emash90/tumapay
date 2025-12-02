import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessTypeAndDocuments1764585477521 implements MigrationInterface {
    name = 'AddBusinessTypeAndDocuments1764585477521'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."documents_document_type_enum" AS ENUM('business_registration_certificate', 'certificate_of_incorporation', 'cr12_form', 'memorandum_and_articles', 'partnership_deed', 'partnership_registration', 'kra_pin_certificate', 'company_kra_pin', 'partnership_kra_pin', 'national_id', 'passport', 'directors_ids', 'partners_ids', 'proof_of_address', 'bank_statement')`);
        await queryRunner.query(`CREATE TYPE "public"."documents_status_enum" AS ENUM('pending', 'approved', 'rejected', 'expired')`);
        await queryRunner.query(`CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "business_id" uuid NOT NULL, "document_type" "public"."documents_document_type_enum" NOT NULL, "file_name" character varying(255) NOT NULL, "file_url" character varying(500) NOT NULL, "file_size" integer NOT NULL, "mime_type" character varying(100) NOT NULL, "cloudinary_public_id" character varying(255), "cloudinary_folder" character varying(255), "status" "public"."documents_status_enum" NOT NULL DEFAULT 'pending', "uploaded_by" uuid NOT NULL, "verified_by" uuid, "verified_at" TIMESTAMP, "rejection_reason" text, "expires_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0ac6db0be1ba323e80e653b0e6" ON "documents" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_709389d904fa03bdf5ec84998d" ON "documents" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_b882920680255cd1f3fcca0efe" ON "documents" ("document_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_c9b63c06887f537d9e5cd2cd3d" ON "documents" ("business_id") `);
        await queryRunner.query(`CREATE TYPE "public"."businesses_business_type_enum" AS ENUM('sole_proprietor', 'limited_company', 'partnership')`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "business_type" "public"."businesses_business_type_enum"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_c9b63c06887f537d9e5cd2cd3d5" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_b9e28779ec77ff2223e2da41f6d" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_647be7c22f279b5747c243303de" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_647be7c22f279b5747c243303de"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_b9e28779ec77ff2223e2da41f6d"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_c9b63c06887f537d9e5cd2cd3d5"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "business_type"`);
        await queryRunner.query(`DROP TYPE "public"."businesses_business_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9b63c06887f537d9e5cd2cd3d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b882920680255cd1f3fcca0efe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_709389d904fa03bdf5ec84998d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ac6db0be1ba323e80e653b0e6"`);
        await queryRunner.query(`DROP TABLE "documents"`);
        await queryRunner.query(`DROP TYPE "public"."documents_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."documents_document_type_enum"`);
    }

}
