import { IsNumber, IsString, IsPositive, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SupportedFiatCurrency {
  KES = 'KES',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  TRY = 'TRY',
}

export class ConvertToUSDTDto {
  @ApiProperty({
    description: 'Amount in fiat currency to convert',
    example: 10000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Source fiat currency',
    enum: SupportedFiatCurrency,
    example: 'KES',
  })
  @IsEnum(SupportedFiatCurrency)
  fromCurrency: SupportedFiatCurrency;
}

export class ConvertFromUSDTDto {
  @ApiProperty({
    description: 'Amount in USDT to convert',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Target fiat currency',
    enum: SupportedFiatCurrency,
    example: 'KES',
  })
  @IsEnum(SupportedFiatCurrency)
  toCurrency: SupportedFiatCurrency;
}

export class WithdrawUSDTDto {
  @ApiProperty({
    description: 'Amount of USDT to withdraw',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'TRON wallet address (TRC20)',
    example: 'TYourTronWalletAddressHere',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Network to use for withdrawal',
    example: 'TRX',
    default: 'TRX',
  })
  @IsString()
  network: string = 'TRX'; // TRON network
}
