import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessType } from '../../../database/entities/business.entity';

export class UpdateBusinessDto {
  @ApiPropertyOptional({
    example: 'Acme Corporation Ltd',
    description: 'Business name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  businessName?: string;

  @ApiPropertyOptional({
    enum: BusinessType,
    example: BusinessType.LIMITED_COMPANY,
    description: 'Type of business entity (sole_proprietor, limited_company, partnership)',
  })
  @IsOptional()
  @IsEnum(BusinessType, { message: 'Invalid business type' })
  businessType?: BusinessType;

  @ApiPropertyOptional({
    example: 'Technology',
    description: 'Industry or business sector',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  industry?: string;

  @ApiPropertyOptional({
    example: 'info@acmecorp.com',
    description: 'Business email address',
  })
  @IsOptional()
  @IsEmail()
  businessEmail?: string;

  @ApiPropertyOptional({
    example: '+254712345678',
    description: 'Business phone number',
  })
  @IsOptional()
  @IsPhoneNumber()
  businessPhone?: string;

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
