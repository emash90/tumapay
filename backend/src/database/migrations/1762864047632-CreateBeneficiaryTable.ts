import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBeneficiaryTable1762864047632 implements MigrationInterface {
    name = 'CreateBeneficiaryTable1762864047632'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "beneficiaries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "business_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "country" character varying(2) NOT NULL DEFAULT 'TR', "currency" character varying(10) NOT NULL DEFAULT 'TRY', "iban" character varying(26) NOT NULL, "bank_name" character varying(255), "bank_code" character varying(11), "phone" character varying(20), "email" character varying(255), "national_id" character varying(11) NOT NULL, "additional_details" jsonb, "is_verified" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_c9356d282dec80f7f12a9eef10a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8d4546acc2c641bc74026d5353" ON "beneficiaries" ("iban") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d00b0cac84a3bb61d832d4bbe9" ON "beneficiaries" ("business_id", "iban") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_ff84af9e9dfc842bcf4de64714" ON "beneficiaries" ("business_id", "is_active") `);
        await queryRunner.query(`ALTER TABLE "beneficiaries" ADD CONSTRAINT "FK_a6f737874d1785df4a26e07a68d" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "beneficiaries" DROP CONSTRAINT "FK_a6f737874d1785df4a26e07a68d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff84af9e9dfc842bcf4de64714"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d00b0cac84a3bb61d832d4bbe9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8d4546acc2c641bc74026d5353"`);
        await queryRunner.query(`DROP TABLE "beneficiaries"`);
    }

}
