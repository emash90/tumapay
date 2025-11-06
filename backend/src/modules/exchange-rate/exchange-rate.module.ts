import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { AuthModule } from '../auth/auth.module';
import currencyApiConfig from '../../config/currency-api.config';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forFeature(currencyApiConfig),
    CacheModule.register(),
    AuthModule,
  ],
  controllers: [ExchangeRateController],
  providers: [ExchangeRateService],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}
