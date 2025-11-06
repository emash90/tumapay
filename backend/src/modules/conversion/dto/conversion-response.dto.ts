import { ApiProperty } from '@nestjs/swagger';

export class ConversionResponseDto {
  @ApiProperty({
    description: 'Conversion transaction ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Conversion reference',
    example: 'CONV-1730123456-ABC123',
  })
  reference: string;

  @ApiProperty({
    description: 'Transaction status',
    example: 'completed',
  })
  status: string;

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
    description: 'Final amount in target currency',
    example: 7.425,
  })
  targetAmount: number;

  @ApiProperty({
    description: 'Target currency code',
    example: 'USDT',
  })
  targetCurrency: string;

  @ApiProperty({
    description: 'Exchange rate used',
    example: 0.007462,
  })
  exchangeRate: number;

  @ApiProperty({
    description: 'Fee charged in source currency',
    example: 10,
  })
  conversionFee: number;

  @ApiProperty({
    description: 'Source wallet ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  sourceWalletId: string;

  @ApiProperty({
    description: 'Target wallet ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  targetWalletId: string;

  @ApiProperty({
    description: 'Timestamp when conversion was completed',
  })
  completedAt: Date;
}
