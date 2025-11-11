import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { BlockchainMonitoringService } from './services/blockchain-monitoring.service';
import { GasMonitoringService } from './services/gas-monitoring.service';
import { BlockchainTransactionService } from './blockchain-transaction.service';

/**
 * TRON Blockchain Controller
 *
 * Provides endpoints to monitor blockchain transactions and gas fees.
 * These are admin-only endpoints for monitoring and debugging.
 *
 * Simple implementation with basic endpoints:
 * - Check monitoring service status
 * - View pending transactions
 * - View specific transaction details
 * - Check TRX balance and gas status
 */
@ApiTags('blockchain')
@Controller('blockchain')
@UseGuards(AuthGuard)
@ApiBearerAuth('bearer')
export class TronController {
  constructor(
    private readonly monitoringService: BlockchainMonitoringService,
    private readonly gasMonitoringService: GasMonitoringService,
    private readonly blockchainTxService: BlockchainTransactionService,
  ) {}

  /**
   * Get monitoring service statistics
   * Shows how many transactions are being monitored and the service status
   */
  @Get('monitoring/stats')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: '[ADMIN] Get blockchain monitoring statistics',
    description:
      'Returns the status of the monitoring service and list of pending transactions',
  })
  @ApiResponse({
    status: 200,
    description: 'Monitoring statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing auth token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getMonitoringStats() {
    const stats = await this.monitoringService.getMonitoringStats();

    return {
      success: true,
      message: 'Monitoring statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get all pending blockchain transactions
   * Useful for debugging - see what transactions are waiting for confirmation
   */
  @Get('transactions/pending')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: '[ADMIN] Get all pending blockchain transactions',
    description:
      'Returns list of all blockchain transactions waiting for confirmation',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending transactions retrieved successfully',
  })
  async getPendingTransactions() {
    const pending = await this.blockchainTxService.findPendingTransactions();

    return {
      success: true,
      message: `Found ${pending.length} pending transaction(s)`,
      data: {
        count: pending.length,
        transactions: pending.map((tx) => ({
          id: tx.id,
          txHash: tx.txHash,
          amount: tx.amount,
          currency: tx.currency,
          network: tx.network,
          status: tx.status,
          fromAddress: tx.fromAddress,
          toAddress: tx.toAddress,
          checkCount: tx.checkCount,
          createdAt: tx.createdAt,
          lastCheckedAt: tx.lastCheckedAt,
          explorerUrl: `https://tronscan.org/#/transaction/${tx.txHash}`,
        })),
      },
    };
  }

  /**
   * Get blockchain transaction by transaction hash
   * Look up a specific transaction to see its status
   */
  @Get('transactions/:txHash')
  @ApiOperation({
    summary: 'Get blockchain transaction by hash',
    description: 'Returns details of a specific blockchain transaction',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction found',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async getTransactionByHash(@Param('txHash') txHash: string) {
    const tx = await this.blockchainTxService.findByTxHash(txHash);

    if (!tx) {
      throw new NotFoundException(
        `Blockchain transaction with hash ${txHash} not found`,
      );
    }

    return {
      success: true,
      message: 'Transaction found',
      data: {
        transaction: {
          id: tx.id,
          txHash: tx.txHash,
          amount: tx.amount,
          currency: tx.currency,
          network: tx.network,
          status: tx.status,
          fromAddress: tx.fromAddress,
          toAddress: tx.toAddress,
          confirmations: tx.confirmations,
          blockNumber: tx.blockNumber,
          energyUsed: tx.energyUsed,
          checkCount: tx.checkCount,
          createdAt: tx.createdAt,
          confirmedAt: tx.confirmedAt,
          failedAt: tx.failedAt,
          lastCheckedAt: tx.lastCheckedAt,
          errorMessage: tx.errorMessage,
          explorerUrl: `https://tronscan.org/#/transaction/${tx.txHash}`,
          metadata: tx.metadata,
        },
      },
    };
  }

  /**
   * Health check - is monitoring service running?
   */
  @Get('monitoring/health')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: '[ADMIN] Check if monitoring service is running',
    description: 'Simple health check endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Service status',
  })
  async checkMonitoringHealth() {
    const isActive = this.monitoringService.isMonitoringActive();

    return {
      success: true,
      message: isActive
        ? 'Monitoring service is running'
        : 'Monitoring service is not running',
      data: {
        isActive,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Get TRX balance status
   * Check current TRX balance and health status
   */
  @Get('gas/balance')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: '[ADMIN] Get TRX balance status',
    description:
      'Returns current TRX balance and health status with thresholds',
  })
  @ApiResponse({
    status: 200,
    description: 'TRX balance status retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing auth token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getTRXBalanceStatus() {
    const status = await this.gasMonitoringService.getBalanceStatus();

    return {
      success: true,
      message: status.message,
      data: status,
    };
  }

  /**
   * Manually trigger TRX balance check
   * Force an immediate balance check without waiting for hourly cron
   */
  @Post('gas/check')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: '[ADMIN] Manually trigger TRX balance check',
    description:
      'Forces an immediate TRX balance check instead of waiting for the hourly cron job',
  })
  @ApiResponse({
    status: 200,
    description: 'Manual balance check completed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing auth token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async manualBalanceCheck() {
    const result = await this.gasMonitoringService.manualBalanceCheck();

    return {
      success: true,
      message: 'Manual balance check completed',
      data: result,
    };
  }
}
