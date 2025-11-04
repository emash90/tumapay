import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from '../../database/entities/wallet.entity';
import { WalletTransaction } from '../../database/entities/wallet-transaction.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { AuthModule } from '../auth/auth.module';
import { BusinessModule } from '../business/business.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { PaymentProvidersModule } from '../payment-providers/payment-providers.module';
import { WithdrawalLimitsService } from './services/withdrawal-limits.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction, Transaction]),
    AuthModule,
    BusinessModule,
    TransactionsModule,
    PaymentProvidersModule, // Use payment providers abstraction layer
  ],
  controllers: [WalletController],
  providers: [WalletService, WithdrawalLimitsService],
  exports: [WalletService],
})
export class WalletModule {}
