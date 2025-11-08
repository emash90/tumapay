import { IsNumber, IsString, IsPositive, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WalletCurrency } from '../../../database/entities/wallet.entity';

/**
 * NOTE: ConvertToUSDTDto and ConvertFromUSDTDto have been removed.
 *
 * REASON: Binance does not support fiat currency trading.
 *
 * For fiat → USDT conversions, use the Conversion Module:
 *   POST /conversions/convert
 *   Body: { amount, fromCurrency: "KES", toCurrency: "USDT" }
 *
 * See TUM-60 for proper integration.
 */

/**
 * DTO for combined convert-and-withdraw operation
 * Converts fiat currency to USDT, then withdraws to blockchain
 */
export class ConvertAndWithdrawDto {
  @ApiProperty({
    description: 'Amount in source currency to convert',
    example: 150000,
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
    description: 'TRON wallet address (TRC20) to receive USDT',
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

  @ApiProperty({
    description: 'Optional description for the transaction',
    example: 'Cross-border payment to supplier',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
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
