import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsKenyanPhoneNumber, normalizeKenyanPhone } from '../../../common/validators/kenyan-phone.validator';

/**
 * M-Pesa Deposit DTO
 * Used for POST /wallets/deposit/mpesa
 */
export class MpesaDepositDto {
  @ApiProperty({
    description: 'Amount to deposit',
    example: 1000,
    minimum: 10,
    maximum: 150000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(10, { message: 'Minimum deposit is 10' })
  @Max(150000, { message: 'Maximum deposit is 150,000' })
  amount: number;

  @ApiProperty({
    description: 'Phone number for M-Pesa payment (accepts 0712345678 or 254712345678)',
    example: '0712345678',
    pattern: '^(0[17]\\d{8}|254[17]\\d{8})$',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Transform(({ value }) => normalizeKenyanPhone(value))
  @IsKenyanPhoneNumber({ message: 'Phone number must be in format 0712345678 or 254712345678' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Optional description for the deposit',
    example: 'Wallet top-up for business expenses',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}

/**
 * Bank Transfer Deposit DTO
 * Used for POST /wallets/deposit/bank-transfer
 */
export class BankTransferDepositDto {
  @ApiProperty({
    description: 'Amount to deposit',
    example: 5000,
    minimum: 10,
    maximum: 150000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(10, { message: 'Minimum deposit is 10' })
  @Max(150000, { message: 'Maximum deposit is 150,000' })
  amount: number;

  @ApiProperty({
    description: 'Account number for bank transfer',
    example: '1234567890',
  })
  @IsNotEmpty({ message: 'Account number is required' })
  @IsString({ message: 'Account number must be a string' })
  accountNumber: string;

  @ApiProperty({
    description: 'Account holder name for bank transfer',
    example: 'John Doe Business Ltd',
  })
  @IsNotEmpty({ message: 'Account holder name is required' })
  @IsString({ message: 'Account holder name must be a string' })
  accountHolderName: string;

  @ApiProperty({
    description: 'Bank name for bank transfer',
    example: 'ABSA Bank Kenya',
  })
  @IsNotEmpty({ message: 'Bank name is required' })
  @IsString({ message: 'Bank name must be a string' })
  bankName: string;

  @ApiProperty({
    description: 'Bank branch for bank transfer',
    example: 'Nairobi Westlands Branch',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Bank branch must be a string' })
  bankBranch?: string;

  @ApiProperty({
    description: 'Optional description for the deposit',
    example: 'Business account funding',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
