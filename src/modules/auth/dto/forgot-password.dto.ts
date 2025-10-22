import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address to send password reset link',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}
