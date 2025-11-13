import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MpesaService } from './mpesa.service';
import { MpesaController } from './mpesa.controller';
import { MpesaReconciliationService } from './services/mpesa-reconciliation.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { WalletModule } from '../wallet/wallet.module';

/**
 * M-Pesa Module
 *
 * Provides M-Pesa integration for deposits and withdrawals.
 *
 * Features:
 * - STK Push for deposits
 * - B2C for withdrawals
 * - Automatic transaction reconciliation (runs every 10 minutes)
 * - Webhook callbacks for real-time status updates
 *
 * Automatic Services:
 * - MpesaReconciliationService: Reconciles pending transactions every 10 minutes
 *   - Queries M-Pesa for transaction status
 *   - Credits wallet if successful
 *   - Marks failed/timed-out transactions
 */
@Module({
  imports: [
    ConfigModule, // For accessing environment variables
    ScheduleModule.forRoot(), // Enable cron jobs for reconciliation
    TransactionsModule, // For TransactionsService
    forwardRef(() => WalletModule), // For WalletService (circular dependency)
  ],
  controllers: [MpesaController],
  providers: [
    MpesaService,
    MpesaReconciliationService, // Automatic reconciliation service
  ],
  exports: [
    MpesaService,
    MpesaReconciliationService, // Export for manual reconciliation triggers
  ],
})
export class MpesaModule {}
