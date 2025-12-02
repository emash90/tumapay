import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransferTimelineService } from './services/transfer-timeline.service';
import { TransfersController } from './transfers.controller';
import { TransferTimeline } from '../../database/entities/transfer-timeline.entity';
import { User } from '../../database/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module';
import { BinanceModule } from '../binance/binance.module';
import { TronModule } from '../tron/tron.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

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
 * - EmailModule: For transfer success/failure notifications
 */
@Module({
  imports: [
    // Register entities with TypeORM
    TypeOrmModule.forFeature([TransferTimeline, User]),

    // Import dependent modules
    WalletModule,
    BeneficiariesModule,
    BinanceModule,
    TronModule,
    TransactionsModule,
    ExchangeRateModule, // Note: singular, not plural
    AuthModule,
    EmailModule,
  ],
  controllers: [TransfersController],
  providers: [TransfersService, TransferTimelineService],
  exports: [TransfersService, TransferTimelineService],
})
export class TransfersModule {}
