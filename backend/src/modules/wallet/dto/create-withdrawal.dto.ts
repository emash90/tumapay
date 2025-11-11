import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsKenyanPhoneNumber } from '../../../common/validators/kenyan-phone.validator';

/**
 * M-Pesa Withdrawal DTO
 * Used for POST /wallets/:walletId/withdraw/mpesa
 */
export class MpesaWithdrawalDto {
  @ApiProperty({
    description: 'Amount to withdraw',
    example: 5000,
    minimum: 10,
    maximum: 150000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(10, { message: 'Minimum withdrawal amount is 10' })
  @Max(150000, { message: 'Maximum withdrawal amount is 150,000 per transaction' })
  amount: number;

  @ApiProperty({
    description: 'Phone number to receive M-Pesa payment (254XXXXXXXXX format)',
    example: '254712345678',
    pattern: '^254[17]\\d{8}$',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @IsKenyanPhoneNumber({ message: 'Phone number must be in format 254XXXXXXXXX (e.g., 254712345678)' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Optional description for the withdrawal',
    example: 'Business funds withdrawal',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(200, { message: 'Description cannot exceed 200 characters' })
  description?: string;
}

/**
 * Bank Transfer Withdrawal DTO
 * Used for POST /wallets/:walletId/withdraw/bank-transfer
 */
export class BankTransferWithdrawalDto {
  @ApiProperty({
    description: 'Amount to withdraw',
    example: 5000,
    minimum: 10,
    maximum: 150000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(10, { message: 'Minimum withdrawal amount is 10' })
  @Max(150000, { message: 'Maximum withdrawal amount is 150,000 per transaction' })
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
    description: 'Optional description for the withdrawal',
    example: 'Business funds withdrawal',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(200, { message: 'Description cannot exceed 200 characters' })
  description?: string;
}

/**
 * USDT (TRON Network) Withdrawal DTO
 * Used for POST /wallets/:walletId/withdraw/usdt
 */
export class UsdtWithdrawalDto {
  @ApiProperty({
    description: 'Amount to withdraw in USDT',
    example: 100,
    minimum: 10,
    maximum: 10000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(10, { message: 'Minimum withdrawal amount is 10 USDT' })
  @Max(10000, { message: 'Maximum withdrawal amount is 10,000 USDT per transaction' })
  amount: number;

  @ApiProperty({
    description: 'TRON wallet address to receive USDT (TRC20)',
    example: 'TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW',
    pattern: '^T[A-Za-z0-9]{33}$',
  })
  @IsNotEmpty({ message: 'TRON address is required' })
  @IsString({ message: 'TRON address must be a string' })
  tronAddress: string;

  @ApiProperty({
    description: 'Optional description for the withdrawal',
    example: 'USDT withdrawal to external wallet',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(200, { message: 'Description cannot exceed 200 characters' })
  description?: string;
}
