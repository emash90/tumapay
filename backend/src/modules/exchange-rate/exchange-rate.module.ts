import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { AuthModule } from '../auth/auth.module';
import currencyApiConfig from '../../config/currency-api.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRateHistory } from 'src/database/entities/exchange-rate-history.entity';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forFeature(currencyApiConfig),
    CacheModule.register(),
    TypeOrmModule.forFeature([ExchangeRateHistory]),
    AuthModule,
  ],
  controllers: [ExchangeRateController],
  providers: [ExchangeRateService],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}
