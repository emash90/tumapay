import { IsString, IsNumber, IsEnum, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum B2CCommandId {
  BUSINESS_PAYMENT = 'BusinessPayment',
  SALARY_PAYMENT = 'SalaryPayment',
  PROMOTION_PAYMENT = 'PromotionPayment',
}

export class B2CDto {
  @ApiProperty({
    example: '+254712345678',
    description: 'Recipient phone number in international format',
  })
  @IsString()
  @Matches(/^\+254\d{9}$/, {
    message: 'Phone number must be in format +254XXXXXXXXX',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 100,
    description: 'Amount to send (minimum 10 KES)',
    minimum: 10,
  })
  @IsNumber()
  @Min(10, { message: 'Amount must be at least 10 KES' })
  amount: number;

  @ApiProperty({
    example: B2CCommandId.BUSINESS_PAYMENT,
    description: 'Type of B2C payment',
    enum: B2CCommandId,
  })
  @IsEnum(B2CCommandId, {
    message: 'Command ID must be BusinessPayment, SalaryPayment, or PromotionPayment',
  })
  commandId: B2CCommandId;

  @ApiProperty({
    example: 'Payout for services',
    description: 'Transaction remarks',
  })
  @IsString()
  remarks: string;

  @ApiProperty({
    example: 'Monthly payout',
    description: 'Occasion/reason for payment',
  })
  @IsString()
  occasion: string;
}
