import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { WalletCurrency } from '../../../database/entities/wallet.entity';

export class DepositWalletDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsEnum(WalletCurrency)
  currency: WalletCurrency;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
