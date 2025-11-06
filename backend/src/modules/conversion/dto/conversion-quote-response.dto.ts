import { ApiProperty } from '@nestjs/swagger';

export class ConversionQuoteResponseDto {
  @ApiProperty({
    description: 'Amount in source currency',
    example: 1000,
  })
  sourceAmount: number;

  @ApiProperty({
    description: 'Source currency code',
    example: 'KES',
  })
  sourceCurrency: string;

  @ApiProperty({
    description: 'Amount in target currency (after conversion, before fees)',
    example: 7.5,
  })
  targetAmount: number;

  @ApiProperty({
    description: 'Target currency code',
    example: 'USDT',
  })
  targetCurrency: string;

  @ApiProperty({
    description: 'Final amount in target currency (after fees)',
    example: 7.425,
  })
  finalAmount: number;

  @ApiProperty({
    description: 'Exchange rate used (1 source = X target)',
    example: 0.0075,
  })
  exchangeRate: number;

  @ApiProperty({
    description: 'Exchange rate with markup applied',
    example: 0.007462,
  })
  effectiveRate: number;

  @ApiProperty({
    description: 'Total fee charged in source currency',
    example: 10,
  })
  totalFee: number;

  @ApiProperty({
    description: 'Fee breakdown with detailed components',
    example: {
      percentageFee: 5,
      fixedFee: 5,
      minimumFee: 10,
      rateMarkup: 0.5,
      appliedFee: 10,
    },
  })
  feeBreakdown: {
    percentageFee: number;
    fixedFee: number;
    minimumFee: number;
    rateMarkup: number;
    appliedFee: number;
  };

  @ApiProperty({
    description: 'Unix timestamp of the exchange rate',
    example: 1730123456,
  })
  rateTimestamp: number;

  @ApiProperty({
    description: 'Source of the exchange rate',
    example: 'currencyapi',
  })
  rateSource: string;

  @ApiProperty({
    description: 'Quote expiration time in seconds',
    example: 60,
  })
  expiresIn: number;
}
