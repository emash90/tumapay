import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessModule } from './modules/business/business.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { RedisModule } from './modules/redis/redis.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentProvidersModule } from './modules/payment-providers/payment-providers.module';
import { ExchangeRateModule } from './modules/exchange-rate/exchange-rate.module';
import { ConversionModule } from './modules/conversion/conversion.module';
import { BinanceModule } from './modules/binance/binance.module';
import { TronModule } from './modules/tron/tron.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Direct Redis Module
    RedisModule,

    // TypeORM database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    BusinessModule,
    TransactionsModule,
    PaymentProvidersModule,
    WalletModule,
    ExchangeRateModule,
    ConversionModule,
    BinanceModule,
    TronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
