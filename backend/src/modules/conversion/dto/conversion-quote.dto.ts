import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WalletCurrency } from '../../../database/entities/wallet.entity';

export class ConversionQuoteDto {
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
}
