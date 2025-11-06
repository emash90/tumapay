import { IsString, IsNumber, IsOptional, Min, Max, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeeConfigDto {
  @ApiProperty({
    description: 'Source currency (use "*" for wildcard)',
    example: 'KES',
  })
  @IsString()
  fromCurrency: string;

  @ApiProperty({
    description: 'Target currency (use "*" for wildcard)',
    example: 'USDT',
  })
  @IsString()
  toCurrency: string;

  @ApiPropertyOptional({
    description: 'Percentage fee (0-100)',
    example: 1.5,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentageFee?: number;

  @ApiPropertyOptional({
    description: 'Fixed fee in source currency',
    example: 10,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedFee?: number;

  @ApiPropertyOptional({
    description: 'Minimum fee to charge',
    example: 5,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumFee?: number;

  @ApiPropertyOptional({
    description: 'Rate markup percentage (0-100)',
    example: 0.5,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rateMarkup?: number;

  @ApiPropertyOptional({
    description: 'Minimum conversion amount',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum conversion amount',
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Priority for rule matching (higher = applied first)',
    example: 100,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { description: 'Standard KES to USDT conversion fee' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
