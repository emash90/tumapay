import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTransactionsTable1730104000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create transactions table
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'KES'",
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['payout', 'collection', 'transfer'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed', 'reversed'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'business_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'recipient_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'recipient_account',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'recipient_bank_code',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'provider_transaction_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'provider_name',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'reversed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'original_transaction_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'last_retry_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create composite index for common queries (business_id, status, created_at)
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_TRANSACTIONS_BUSINESS_STATUS_CREATED',
        columnNames: ['business_id', 'status', 'created_at'],
      }),
    );

    // Create index for reference lookup (unique index)
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_TRANSACTIONS_REFERENCE',
        columnNames: ['reference'],
        isUnique: true,
      }),
    );

    // Create index for provider transaction ID lookup
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_TRANSACTIONS_PROVIDER_ID',
        columnNames: ['provider_transaction_id'],
      }),
    );

    // Create index for user_id
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_TRANSACTIONS_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    // Create index for created_at (for date range queries)
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_TRANSACTIONS_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );

    // Add foreign key constraint to businesses table
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        name: 'FK_TRANSACTIONS_BUSINESS',
        columnNames: ['business_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'businesses',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Add foreign key constraint to users table
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        name: 'FK_TRANSACTIONS_USER',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Add foreign key constraint to original_transaction (self-referencing for reversals)
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        name: 'FK_TRANSACTIONS_ORIGINAL',
        columnNames: ['original_transaction_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'transactions',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey('transactions', 'FK_TRANSACTIONS_ORIGINAL');
    await queryRunner.dropForeignKey('transactions', 'FK_TRANSACTIONS_USER');
    await queryRunner.dropForeignKey('transactions', 'FK_TRANSACTIONS_BUSINESS');

    // Drop indexes
    await queryRunner.dropIndex('transactions', 'IDX_TRANSACTIONS_CREATED_AT');
    await queryRunner.dropIndex('transactions', 'IDX_TRANSACTIONS_USER_ID');
    await queryRunner.dropIndex('transactions', 'IDX_TRANSACTIONS_PROVIDER_ID');
    await queryRunner.dropIndex('transactions', 'IDX_TRANSACTIONS_REFERENCE');
    await queryRunner.dropIndex('transactions', 'IDX_TRANSACTIONS_BUSINESS_STATUS_CREATED');

    // Drop table
    await queryRunner.dropTable('transactions');
  }
}
