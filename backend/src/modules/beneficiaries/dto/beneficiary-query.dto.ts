import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for querying/filtering beneficiaries
 */
export class BeneficiaryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by verified status',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Include soft-deleted beneficiaries (admin only)',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeDeleted?: boolean;
}
