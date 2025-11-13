import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransferTimelineService } from './services/transfer-timeline.service';
import { TransfersController } from './transfers.controller';
import { TransferTimeline } from '../../database/entities/transfer-timeline.entity';
import { WalletModule } from '../wallet/wallet.module';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module';
import { BinanceModule } from '../binance/binance.module';
import { TronModule } from '../tron/tron.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { AuthModule } from '../auth/auth.module';

/**
 * TransfersModule
 *
 * Handles cross-border transfer orchestration from KES to Turkish beneficiaries
 * via USDT/TRON network.
 *
 * Integrates with:
 * - WalletModule: For KES wallet debit/credit operations
 * - BeneficiariesModule: For beneficiary validation
 * - ExchangeRateModule: For KES → USD exchange rates
 * - BinanceModule: For USDT liquidity checking
 * - TronModule: For USDT blockchain transfers
 * - TransactionsModule: For transaction record management
 * - AuthModule: For authentication and authorization
 */
@Module({
  imports: [
    // Register TransferTimeline entity with TypeORM
    TypeOrmModule.forFeature([TransferTimeline]),

    // Import dependent modules
    WalletModule,
    BeneficiariesModule,
    BinanceModule,
    TronModule,
    TransactionsModule,
    ExchangeRateModule, // Note: singular, not plural
    AuthModule,
  ],
  controllers: [TransfersController],
  providers: [TransfersService, TransferTimelineService],
  exports: [TransfersService, TransferTimelineService],
})
export class TransfersModule {}
