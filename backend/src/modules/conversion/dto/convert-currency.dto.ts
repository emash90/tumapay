import { IsEnum, IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WalletCurrency } from '../../../database/entities/wallet.entity';

export class ConvertCurrencyDto {
  @ApiProperty({
    description: 'Amount to convert in source currency',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Source currency code',
    enum: WalletCurrency,
    example: 'KES',
  })
  @IsEnum(WalletCurrency)
  fromCurrency: WalletCurrency;

  @ApiProperty({
    description: 'Target currency code',
    enum: WalletCurrency,
    example: 'USDT',
  })
  @IsEnum(WalletCurrency)
  toCurrency: WalletCurrency;

  @ApiPropertyOptional({
    description: 'Optional description for the conversion',
    example: 'Convert KES to USDT for payment',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
