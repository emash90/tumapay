import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1761828464909 implements MigrationInterface {
    name = 'InitialSchema1761828464909'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "token" character varying(500) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "ip_address" character varying, "user_agent" character varying, "country" character varying, "device" character varying, "user_id" uuid NOT NULL, CONSTRAINT "UQ_e9f62f5dcb8a54b84234c9e7a06" UNIQUE ("token"), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9cfe37d28c3b229a350e086d94" ON "sessions" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_085d540d9f418cfbdc7bd55bb1" ON "sessions" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9f62f5dcb8a54b84234c9e7a0" ON "sessions" ("token") `);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "provider_id" character varying(255) NOT NULL, "provider_account_id" character varying(255) NOT NULL, "password" character varying(255), "access_token" text, "refresh_token" text, "access_token_expires_at" TIMESTAMP, "refresh_token_expires_at" TIMESTAMP, "scope" character varying, "id_token" character varying, "token_type" character varying, "user_id" uuid NOT NULL, CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3000dad1da61b29953f0747632" ON "accounts" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bb325f1aca3dda7347793f5227" ON "accounts" ("provider_id", "provider_account_id") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "email" character varying(255) NOT NULL, "first_name" character varying(255), "last_name" character varying(255), "image" character varying, "email_verified" boolean NOT NULL DEFAULT false, "phone_number" character varying(255), "phone_number_verified" boolean NOT NULL DEFAULT false, "is_super_admin" boolean NOT NULL DEFAULT false, "two_factor_enabled" boolean NOT NULL DEFAULT false, "two_factor_secret" character varying, "two_factor_backup_codes" text, "business_id" uuid, "last_login_at" TIMESTAMP, "last_login_ip" character varying, "last_login_user_agent" character varying, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "REL_cde4b2aabca86cfabdc78b537f" UNIQUE ("business_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."businesses_kyb_status_enum" AS ENUM('pending', 'in_review', 'verified', 'rejected', 'suspended')`);
        await queryRunner.query(`CREATE TYPE "public"."businesses_tier_enum" AS ENUM('basic', 'premium', 'enterprise')`);
        await queryRunner.query(`CREATE TABLE "businesses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "business_name" character varying(255) NOT NULL, "registration_number" character varying(255) NOT NULL, "tax_id" character varying(255), "kra_pin" character varying(20), "country" character varying(100) NOT NULL, "industry" character varying(255), "description" text, "website" character varying, "business_email" character varying, "business_phone" character varying, "address" text, "city" character varying(100), "state" character varying(100), "postal_code" character varying(20), "kyb_status" "public"."businesses_kyb_status_enum" NOT NULL DEFAULT 'pending', "kyb_provider_id" character varying, "kyb_rejection_reason" text, "kyb_verified_at" TIMESTAMP, "tier" "public"."businesses_tier_enum" NOT NULL DEFAULT 'basic', "daily_limit" numeric(15,2) NOT NULL DEFAULT '10000', "monthly_limit" numeric(15,2) NOT NULL DEFAULT '50000', "metadata" jsonb, CONSTRAINT "UQ_09bf7f60fa1ab278cd278072c10" UNIQUE ("registration_number"), CONSTRAINT "PK_bc1bf63498dd2368ce3dc8686e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2d8d9ae7c9d95748cb8309353b" ON "businesses" ("kra_pin") `);
        await queryRunner.query(`CREATE INDEX "IDX_a171acdfc8131f056afd5a1bbd" ON "businesses" ("tax_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_09bf7f60fa1ab278cd278072c1" ON "businesses" ("registration_number") `);
        await queryRunner.query(`CREATE TYPE "public"."wallets_currency_enum" AS ENUM('KES', 'USDT', 'TRY', 'USD')`);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "business_id" uuid NOT NULL, "currency" "public"."wallets_currency_enum" NOT NULL, "available_balance" numeric(18,6) NOT NULL DEFAULT '0', "pending_balance" numeric(18,6) NOT NULL DEFAULT '0', "total_balance" numeric(18,6) NOT NULL DEFAULT '0', "last_transaction_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8a2f4e2ef68924ad791a85b663" ON "wallets" ("business_id", "currency") `);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('payout', 'collection', 'transfer')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'reversed')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "reference" character varying(50) NOT NULL, "amount" numeric(15,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'KES', "type" "public"."transactions_type_enum" NOT NULL, "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'pending', "business_id" uuid NOT NULL, "user_id" uuid NOT NULL, "recipient_phone" character varying(20), "recipient_account" character varying(50), "recipient_bank_code" character varying(20), "description" text, "metadata" jsonb, "provider_transaction_id" character varying(100), "provider_name" character varying(50), "error_message" text, "error_code" character varying(50), "completed_at" TIMESTAMP, "failed_at" TIMESTAMP, "reversed_at" TIMESTAMP, "original_transaction_id" uuid, "retry_count" integer NOT NULL DEFAULT '0', "last_retry_at" TIMESTAMP, CONSTRAINT "UQ_dd85cc865e0c3d5d4be095d3f3f" UNIQUE ("reference"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fee05835e34e119397b8b90fe1" ON "transactions" ("provider_transaction_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_dd85cc865e0c3d5d4be095d3f3" ON "transactions" ("reference") `);
        await queryRunner.query(`CREATE INDEX "IDX_c284850035c9fd3782ba4e6152" ON "transactions" ("business_id", "status", "created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."wallet_transactions_type_enum" AS ENUM('deposit', 'withdrawal', 'conversion', 'fee', 'reversal')`);
        await queryRunner.query(`CREATE TABLE "wallet_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "wallet_id" uuid NOT NULL, "type" "public"."wallet_transactions_type_enum" NOT NULL, "amount" numeric(18,6) NOT NULL, "balance_after" numeric(18,6) NOT NULL, "description" text, "transaction_id" uuid, "metadata" jsonb, CONSTRAINT "PK_5120f131bde2cda940ec1a621db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_abc0cee75960435ca92bbdc8ff" ON "wallet_transactions" ("transaction_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6956721ecd7d2f8bd5a1d99046" ON "wallet_transactions" ("wallet_id", "created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."verifications_type_enum" AS ENUM('email_verification', 'password_reset', 'phone_verification', 'two_factor_setup')`);
        await queryRunner.query(`CREATE TABLE "verifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "identifier" character varying(255) NOT NULL, "token" character varying(500) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "type" "public"."verifications_type_enum" NOT NULL DEFAULT 'email_verification', "is_used" boolean NOT NULL DEFAULT false, "used_at" TIMESTAMP, CONSTRAINT "PK_2127ad1b143cf012280390b01d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5df3ab071d30f737686fcf2c27" ON "verifications" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_64f1e1292b370fad0bb72d0445" ON "verifications" ("expires_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7191342464149012bb0d10d14d" ON "verifications" ("identifier", "token") `);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_3000dad1da61b29953f07476324" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_cde4b2aabca86cfabdc78b537f0" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_5c1f94868d55a2e1c436823a0e5" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_a86c321b6f66b020b8c5b1c8221" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_b783fa40c871184d41cc9b4d39c" FOREIGN KEY ("original_transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_c57d19129968160f4db28fc8b28" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_abc0cee75960435ca92bbdc8ff6" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_abc0cee75960435ca92bbdc8ff6"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_c57d19129968160f4db28fc8b28"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_b783fa40c871184d41cc9b4d39c"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_a86c321b6f66b020b8c5b1c8221"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_5c1f94868d55a2e1c436823a0e5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_cde4b2aabca86cfabdc78b537f0"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_3000dad1da61b29953f07476324"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7191342464149012bb0d10d14d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64f1e1292b370fad0bb72d0445"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5df3ab071d30f737686fcf2c27"`);
        await queryRunner.query(`DROP TABLE "verifications"`);
        await queryRunner.query(`DROP TYPE "public"."verifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6956721ecd7d2f8bd5a1d99046"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_abc0cee75960435ca92bbdc8ff"`);
        await queryRunner.query(`DROP TABLE "wallet_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_transactions_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c284850035c9fd3782ba4e6152"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd85cc865e0c3d5d4be095d3f3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fee05835e34e119397b8b90fe1"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8a2f4e2ef68924ad791a85b663"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP TYPE "public"."wallets_currency_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09bf7f60fa1ab278cd278072c1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a171acdfc8131f056afd5a1bbd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2d8d9ae7c9d95748cb8309353b"`);
        await queryRunner.query(`DROP TABLE "businesses"`);
        await queryRunner.query(`DROP TYPE "public"."businesses_tier_enum"`);
        await queryRunner.query(`DROP TYPE "public"."businesses_kyb_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb325f1aca3dda7347793f5227"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3000dad1da61b29953f0747632"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9f62f5dcb8a54b84234c9e7a0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_085d540d9f418cfbdc7bd55bb1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9cfe37d28c3b229a350e086d94"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
    }

}
