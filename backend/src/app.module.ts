import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { BeneficiariesModule } from './modules/beneficiaries/beneficiaries.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { EmailModule } from './modules/email/email.module';
import { AuditModule } from './modules/audit/audit.module';
import { StorageModule } from './modules/storage/storage.module';
import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Global rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests per minute (default)
      },
    ]),

    // Direct Redis Module
    RedisModule,

    // TypeORM database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Feature modules
    EmailModule,
    AuditModule,
    AuthModule,
    BusinessModule,
    BeneficiariesModule,
    TransactionsModule,
    PaymentProvidersModule,
    WalletModule,
    ExchangeRateModule,
    ConversionModule,
    BinanceModule,
    TronModule,
    TransfersModule,
    StorageModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
