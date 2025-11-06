import { PartialType } from '@nestjs/swagger';
import { CreateFeeConfigDto } from './create-fee-config.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFeeConfigDto extends PartialType(CreateFeeConfigDto) {
  @ApiPropertyOptional({
    description: 'Whether this configuration is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
