import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
  MinLength,
  IsObject,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsValidIban, IsValidTcKimlik } from '../decorators';

/**
 * DTO for creating a new beneficiary
 *
 * All required fields for Turkish beneficiary registration
 */
export class CreateBeneficiaryDto {
  @ApiProperty({
    description: 'Full name of the beneficiary',
    example: 'Ahmet Yılmaz',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Turkish IBAN (26 characters: TR + 24 digits)',
    example: 'TR330006100519786457841326',
    minLength: 26,
    maxLength: 26,
  })
  @IsString()
  @IsNotEmpty()
  @Length(26, 26, {
    message: 'Turkish IBAN must be exactly 26 characters',
  })
  @Matches(/^TR[0-9]{24}$/, {
    message: 'IBAN must start with TR followed by 24 digits',
  })
  @IsValidIban({
    message: 'Invalid IBAN checksum. Please verify the IBAN is correct.',
  })
  @Transform(({ value }) => value?.replace(/\s/g, '').toUpperCase())
  iban: string;

  @ApiProperty({
    description: 'Turkish National ID (TC Kimlik Numarası) - 11 digits',
    example: '12345678901',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, {
    message: 'TC Kimlik must be exactly 11 digits',
  })
  @Matches(/^[1-9][0-9]{10}$/, {
    message: 'TC Kimlik must be 11 digits and cannot start with 0',
  })
  @IsValidTcKimlik({
    message: 'Invalid TC Kimlik checksum. Please verify the National ID is correct.',
  })
  @Transform(({ value }) => value?.replace(/\s/g, ''))
  nationalId: string;

  @ApiPropertyOptional({
    description: 'ISO country code (defaults to TR for Turkey)',
    example: 'TR',
    default: 'TR',
    maxLength: 2,
  })
  @IsString()
  @IsOptional()
  @Length(2, 2, { message: 'Country code must be exactly 2 characters' })
  @Transform(({ value }) => value?.toUpperCase())
  country?: string;

  @ApiPropertyOptional({
    description: 'Currency code (defaults to TRY for Turkish Lira)',
    example: 'TRY',
    default: 'TRY',
    maxLength: 10,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  @Transform(({ value }) => value?.toUpperCase())
  currency?: string;

  @ApiPropertyOptional({
    description: 'Name of the bank',
    example: 'Garanti BBVA',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  bankName?: string;

  @ApiPropertyOptional({
    description: 'SWIFT/BIC code (8-11 characters)',
    example: 'TGBATRIS',
    minLength: 8,
    maxLength: 11,
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(11)
  @Transform(({ value }) => value?.toUpperCase().trim())
  bankCode?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+905551234567',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'ahmet.yilmaz@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @ApiPropertyOptional({
    description: 'Additional beneficiary details (address, city, etc.)',
    example: {
      address: 'Atatürk Caddesi No:123',
      city: 'Istanbul',
      postalCode: '34000',
    },
  })
  @IsObject()
  @IsOptional()
  additionalDetails?: Record<string, any>;
}
