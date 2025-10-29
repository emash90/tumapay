import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MpesaCallbackDto {
  @ApiProperty({
    description: 'M-Pesa callback body',
  })
  @IsObject()
  @IsNotEmpty()
  Body: any;
}
