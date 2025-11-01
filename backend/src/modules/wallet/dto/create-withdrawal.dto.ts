import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsKenyanPhoneNumber } from '../../../common/validators/kenyan-phone.validator';

export class CreateWithdrawalDto {
  @ApiProperty({
    description: 'Amount to withdraw in KES',
    example: 5000,
    minimum: 10,
    maximum: 150000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(10, { message: 'Minimum withdrawal amount is 10 KES' })
  @Max(150000, { message: 'Maximum withdrawal amount is 150,000 KES per transaction' })
  amount: number;

  @ApiProperty({
    description: 'Phone number to receive M-Pesa payment (254XXXXXXXXX format)',
    example: '254712345678',
    pattern: '^254[17]\\d{8}$',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @IsKenyanPhoneNumber({ message: 'Phone number must be in format 254XXXXXXXXX (e.g., 254712345678)' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Optional description for the withdrawal',
    example: 'Business funds withdrawal',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(200, { message: 'Description cannot exceed 200 characters' })
  description?: string;
}
