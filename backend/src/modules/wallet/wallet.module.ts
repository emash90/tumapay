import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from '../../database/entities/wallet.entity';
import { WalletTransaction } from '../../database/entities/wallet-transaction.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { AuthModule } from '../auth/auth.module';
import { BusinessModule } from '../business/business.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { MpesaModule } from '../mpesa/mpesa.module';
import { WithdrawalLimitsService } from './services/withdrawal-limits.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction, Transaction]),
    AuthModule,
    BusinessModule,
    TransactionsModule,
    forwardRef(() => MpesaModule), // Use forwardRef to resolve circular dependency
  ],
  controllers: [WalletController],
  providers: [WalletService, WithdrawalLimitsService],
  exports: [WalletService],
})
export class WalletModule {}
