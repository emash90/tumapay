import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConversionController } from './conversion.controller';
import { ConversionService } from './conversion.service';
import { FeeConfigService } from './services/fee-config.service';
import { FeeCalculationService } from './services/fee-calculation.service';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessModule } from '../business/business.module';
import { Transaction } from '../../database/entities/transaction.entity';
import { WalletTransaction } from '../../database/entities/wallet-transaction.entity';
import { ExchangeRateHistory } from '../../database/entities/exchange-rate-history.entity';
import { ConversionFeeConfig } from '../../database/entities/conversion-fee-config.entity';
import { Wallet } from '../../database/entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      WalletTransaction,
      ExchangeRateHistory,
      ConversionFeeConfig,
      Wallet,
    ]),
    HttpModule,
    AuthModule,
    BusinessModule,
    ExchangeRateModule,
    WalletModule,
  ],
  controllers: [ConversionController],
  providers: [
    ConversionService,
    FeeConfigService,
    FeeCalculationService,
  ],
  exports: [
    ConversionService,
    FeeConfigService,
    FeeCalculationService,
  ],
})
export class ConversionModule {}
