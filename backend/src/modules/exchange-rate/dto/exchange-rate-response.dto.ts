import { ApiProperty } from '@nestjs/swagger';

export class ExchangeRateDto {
  @ApiProperty({ example: 'KES' })
  from: string;

  @ApiProperty({ example: 'USDT' })
  to: string;

  @ApiProperty({ example: 0.0077 })
  rate: number;

  @ApiProperty({ example: 129.87 })
  inverseRate: number;

  @ApiProperty({ example: 1699012345 })
  timestamp: number;

  @ApiProperty({ example: 'cache' })
  source: string;
}

export class AllExchangeRatesDto {
  @ApiProperty({ example: 'EUR' })
  baseCurrency: string;

  @ApiProperty({
    example: {
      USD: 1.09,
      GBP: 0.86,
      KES: 140.23,
      TRY: 29.45,
    },
  })
  rates: Record<string, number>;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty({ example: 'cache' })
  source: string;
}
