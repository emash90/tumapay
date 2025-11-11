import { Module, OnModuleInit, OnModuleDestroy, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TronService } from './tron.service';
import { BlockchainTransactionService } from './blockchain-transaction.service';
import { BlockchainMonitoringService } from './services/blockchain-monitoring.service';
import { GasMonitoringService } from './services/gas-monitoring.service';
import { TronTransferService } from './services/tron-transfer.service';
import { TronController } from './tron.controller';
import tronConfig from '../../config/tron.config';
import { BlockchainTransaction } from '../../database/entities/blockchain-transaction.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { AuthModule } from '../auth/auth.module';

/**
 * TRON Module
 *
 * Provides TRON blockchain integration for USDT transfers.
 *
 * Features:
 * - USDT transfers to TRON addresses
 * - Blockchain transaction tracking
 * - Automatic transaction monitoring (runs on app startup)
 * - Automatic gas (TRX) monitoring (runs every hour)
 * - Transaction status updates
 * - Admin endpoints for monitoring
 *
 * Automatic Services:
 * - BlockchainMonitoringService: Checks pending transactions every 15 seconds
 * - GasMonitoringService: Checks TRX balance every hour
 *
 * Both services start automatically and stop gracefully on shutdown.
 */
@Module({
  imports: [
    ConfigModule.forFeature(tronConfig),
    TypeOrmModule.forFeature([BlockchainTransaction, Transaction]),
    ScheduleModule.forRoot(), // Enable cron jobs
    forwardRef(() => AuthModule), // Import AuthModule for AuthGuard and SessionService
  ],
  controllers: [TronController],
  providers: [
    TronService,
    BlockchainTransactionService,
    BlockchainMonitoringService,
    GasMonitoringService,
    TronTransferService, // NEW: Transfer service with pessimistic locking
  ],
  exports: [
    TronService,
    BlockchainTransactionService,
    BlockchainMonitoringService,
    GasMonitoringService,
    TronTransferService, // NEW: Export for use in payment providers
  ],
})
export class TronModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly monitoringService: BlockchainMonitoringService,
  ) {}

  /**
   * Called automatically when the app starts
   * Starts the blockchain monitoring service
   */
  async onModuleInit() {
    console.log('🚀 TronModule initialized');
    await this.monitoringService.startMonitoring();
  }

  /**
   * Called automatically when the app shuts down
   * Stops the monitoring service gracefully
   */
  async onModuleDestroy() {
    console.log('🛑 TronModule shutting down');
    this.monitoringService.stopMonitoring();
  }
}
