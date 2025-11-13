import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for creating a new cross-border transfer
 *
 * Initiates a transfer from KES wallet to Turkish beneficiary via USDT/TRON
 */
export class CreateTransferDto {
  @ApiProperty({
    description: 'Beneficiary ID to send money to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty({ message: 'Beneficiary ID is required' })
  beneficiaryId: string;

  @ApiProperty({
    description: 'Amount to transfer in KES (minimum 100 KES, maximum 1,000,000 KES)',
    example: 5000,
    minimum: 100,
    maximum: 1000000,
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Amount is required' })
  @Min(100, { message: 'Minimum transfer amount is 100 KES' })
  @Max(1000000, { message: 'Maximum transfer amount is 1,000,000 KES per transaction' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Purpose or description of the transfer',
    example: 'Monthly salary payment',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({
    description: 'External reference number (for your own tracking)',
    example: 'INV-2024-001',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Reference cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  reference?: string;
}
