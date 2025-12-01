import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessKYBStatus, BusinessTier, BusinessType } from '../../../database/entities/business.entity';

export class BusinessResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  registrationNumber: string;

  @ApiPropertyOptional()
  kraPin?: string;

  @ApiProperty()
  country: string;

  @ApiPropertyOptional({ enum: BusinessType })
  businessType?: BusinessType;

  @ApiPropertyOptional()
  industry?: string;

  @ApiPropertyOptional()
  taxId?: string;

  @ApiPropertyOptional()
  businessEmail?: string;

  @ApiPropertyOptional()
  businessPhone?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiProperty({ enum: BusinessKYBStatus })
  kybStatus: BusinessKYBStatus;

  @ApiProperty({ enum: BusinessTier })
  tier: BusinessTier;

  @ApiProperty()
  dailyLimit: number;

  @ApiProperty()
  monthlyLimit: number;

  @ApiPropertyOptional()
  kybVerifiedAt?: Date;

  @ApiPropertyOptional()
  kybRejectionReason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
