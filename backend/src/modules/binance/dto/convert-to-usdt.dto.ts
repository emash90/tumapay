import { IsNumber, IsString, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
