import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Toggle2FADto {
  @ApiProperty({
    example: true,
    description: 'Enable or disable 2FA',
  })
  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;
}
