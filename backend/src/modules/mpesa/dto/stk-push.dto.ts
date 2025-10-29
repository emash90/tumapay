import { IsString, IsNumber, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StkPushDto {
  @ApiProperty({
    example: '+254712345678',
    description: 'Customer phone number in international format',
  })
  @IsString()
  @Matches(/^\+254\d{9}$/, {
    message: 'Phone number must be in format +254XXXXXXXXX',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 100,
    description: 'Amount to charge (minimum 1 KES)',
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1 KES' })
  amount: number;

  @ApiProperty({
    example: 'Payment for Order #12345',
    description: 'Transaction description',
  })
  @IsString()
  accountReference: string;

  @ApiProperty({
    example: 'Invoice INV-001',
    description: 'Transaction description visible to customer',
  })
  @IsString()
  transactionDesc: string;
}
