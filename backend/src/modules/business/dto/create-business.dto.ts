import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  Length,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessType } from '../../../database/entities/business.entity';

export class CreateBusinessDto {
  @ApiProperty({
    example: 'Acme Corporation Ltd',
    description: 'Business name',
  })
  @IsString()
  @MinLength(2, { message: 'Business name must be at least 2 characters' })
  @MaxLength(255, { message: 'Business name must not exceed 255 characters' })
  businessName: string;

  @ApiProperty({
    example: 'PVT-123456789',
    description: 'Business registration number (must be unique)',
  })
  @IsString()
  @MinLength(6, { message: 'Registration number must be at least 6 characters' })
  @MaxLength(255, { message: 'Registration number must not exceed 255 characters' })
  registrationNumber: string;

  @ApiProperty({
    enum: BusinessType,
    example: BusinessType.LIMITED_COMPANY,
    description: 'Type of business entity (sole_proprietor, limited_company, partnership)',
  })
  @IsEnum(BusinessType, { message: 'Invalid business type' })
  businessType: BusinessType;

  @ApiPropertyOptional({
    example: 'A123456789X',
    description: 'KRA PIN (required for Kenyan businesses). Format: A/P followed by 9 digits and a letter',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[AP][0-9]{9}[A-Z]$/, {
    message: 'Invalid KRA PIN format. Expected format: A123456789X or P123456789X',
  })
  kraPin?: string;

  @ApiProperty({
    example: 'KE',
    description: 'Country code (ISO 3166-1 alpha-2)',
  })
  @IsString()
  @Length(2, 2, { message: 'Country code must be exactly 2 characters (ISO format)' })
  country: string;

  @ApiProperty({
    example: 'Technology',
    description: 'Industry or business sector',
  })
  @IsString()
  @MaxLength(255)
  industry: string;

  @ApiProperty({
    example: 'info@acmecorp.com',
    description: 'Business email address',
  })
  @IsEmail({}, { message: 'Invalid business email format' })
  businessEmail: string;

  @ApiProperty({
    example: '+254712345678',
    description: 'Business phone number',
  })
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  businessPhone: string;

  @ApiPropertyOptional({
    example: '123 Business Street',
    description: 'Business address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Nairobi',
    description: 'City',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: 'Nairobi County',
    description: 'State or region',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    example: '00100',
    description: 'Postal code',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({
    example: 'TAX-123456',
    description: 'Tax ID number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  taxId?: string;

  @ApiPropertyOptional({
    example: 'Leading provider of innovative solutions',
    description: 'Business description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://www.acmecorp.com',
    description: 'Business website URL',
  })
  @IsOptional()
  @IsString()
  website?: string;
}
