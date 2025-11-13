import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TransactionStatus } from '../../../database/entities/transaction.entity';

/**
 * DTO for querying/filtering transfers
 *
 * Supports filtering by status, date range, beneficiary, and pagination
 */
export class TransferQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(TransactionStatus, {
    message: 'Status must be one of: pending, processing, completed, failed, reversed',
  })
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Filter by beneficiary ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiPropertyOptional({
    description: 'Filter transfers created on or after this date (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid ISO 8601 date string' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter transfers created on or before this date (ISO 8601)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date string' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Number of results to return (1-100)',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 20))
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of results to skip (for pagination)',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Offset must be an integer' })
  @Min(0, { message: 'Offset cannot be negative' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 0))
  offset?: number = 0;
}
