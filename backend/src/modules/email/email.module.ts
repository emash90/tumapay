import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import smtpConfig from '../../config/smtp.config';
import appConfig from '../../config/app.config';

@Module({
  imports: [
    ConfigModule.forFeature(smtpConfig),
    ConfigModule.forFeature(appConfig),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
