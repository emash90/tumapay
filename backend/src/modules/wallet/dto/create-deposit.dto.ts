import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsKenyanPhoneNumber } from '../../../common/validators/kenyan-phone.validator';

export class CreateDepositDto {
  @ApiProperty({
    description: 'Amount to deposit in KES',
    example: 1000,
    minimum: 10,
    maximum: 150000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(10, { message: 'Minimum deposit is 10 KES' })
  @Max(150000, { message: 'Maximum deposit is 150,000 KES' })
  amount: number;

  @ApiProperty({
    description: 'Phone number for M-Pesa payment (254XXXXXXXXX format)',
    example: '254712345678',
    pattern: '^254[17]\\d{8}$',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @IsKenyanPhoneNumber({ message: 'Phone number must be in format 254XXXXXXXXX (e.g., 254712345678)' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Optional description for the deposit',
    example: 'Wallet top-up for business expenses',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
