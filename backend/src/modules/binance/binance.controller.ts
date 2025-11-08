import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BinanceService } from './binance.service';
import {
  WithdrawUSDTDto,
  ConvertAndWithdrawDto,
} from './dto/convert-to-usdt.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('Binance')
@Controller('binance')
@UseGuards(AuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class BinanceController {
  constructor(private readonly binanceService: BinanceService) {}

  @Get('price')
  @ApiOperation({ summary: 'Get current price for a trading pair' })
  @ApiResponse({
    status: 200,
    description: 'Price retrieved successfully',
  })
  async getPrice(@Query('symbol') symbol: string) {
    const price = await this.binanceService.getPrice(symbol);
    return {
      symbol,
      price,
      timestamp: Date.now(),
    };
  }

  @Get('exchange-rate')
  @ApiOperation({ summary: 'Get exchange rate between two currencies' })
  @ApiResponse({
    status: 200,
    description: 'Exchange rate retrieved successfully',
  })
  async getExchangeRate(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const rate = await this.binanceService.getExchangeRate(from, to);
    return {
      from,
      to,
      rate,
      timestamp: Date.now(),
    };
  }

  /**
   * NOTE: Fiat conversion endpoints (convert-to-usdt, convert-from-usdt) have been removed.
   *
   * REASON: Binance does NOT support fiat currency trading.
   *
   * FOR FIAT → USDT CONVERSIONS:
   * Use the Conversion Module instead:
   *   POST /conversions/convert
   *   Body: { amount, fromCurrency: "KES", toCurrency: "USDT" }
   *
   * This properly:
   * - Uses Exchange Rate Service for fiat exchange rates
   * - Manages internal wallet balances (KES wallet → USDT wallet)
   * - Applies conversion fees and rate markup
   * - Records transaction history
   *
   * Then use Binance ONLY for withdrawing USDT to blockchain:
   *   POST /binance/withdraw-usdt
   *   Body: { amount, address, network: "TRX" }
   *
   * See TUM-60 for the integrated flow.
   */

  @Get('balance/usdt')
  @ApiOperation({ summary: 'Get USDT balance in Binance account' })
  @ApiResponse({
    status: 200,
    description: 'USDT balance retrieved successfully',
  })
  async getUSDTBalance() {
    const balance = await this.binanceService.getUSDTBalance();
    return {
      asset: balance.asset,
      available: parseFloat(balance.free),
      locked: parseFloat(balance.locked),
      total: parseFloat(balance.free) + parseFloat(balance.locked),
    };
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get balance for any asset' })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved successfully',
  })
  async getBalance(@Query('asset') asset: string) {
    const balance = await this.binanceService.getBalance(asset);
    return {
      asset: balance.asset,
      available: parseFloat(balance.free),
      locked: parseFloat(balance.locked),
      total: parseFloat(balance.free) + parseFloat(balance.locked),
    };
  }

  @Post('withdraw-usdt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw USDT to external wallet' })
  @ApiResponse({
    status: 200,
    description: 'USDT withdrawal initiated successfully',
  })
  async withdrawUSDT(
    @Body() dto: WithdrawUSDTDto,
    @CurrentUser() user: User,
  ) {
    const withdrawal = await this.binanceService.withdrawUSDT(dto, user.businessId, user.id);
    return {
      success: true,
      data: {
        withdrawalId: withdrawal.id,
        amount: withdrawal.amount,
        fee: withdrawal.transactionFee,
        address: withdrawal.address,
        network: dto.network,
        status: withdrawal.status,
        txId: withdrawal.txId || null,
        timestamp: withdrawal.applyTime,
      },
    };
  }

  @Post('convert-and-withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert fiat currency to USDT and withdraw to blockchain',
    description:
      'Combined operation: Converts fiat currency (e.g., KES) to USDT in internal wallets, ' +
      'then immediately withdraws the USDT to an external TRON wallet address. ' +
      'This is the integrated flow for cross-border payments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion and withdrawal completed successfully',
  })
  async convertAndWithdraw(
    @Body() dto: ConvertAndWithdrawDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.binanceService.convertAndWithdraw(
      dto,
      user.businessId,
      user.id,
    );

    return {
      success: true,
      data: {
        // Conversion details
        conversion: {
          transactionId: result.conversion.transactionId,
          reference: result.conversion.reference,
          sourceAmount: result.conversion.sourceAmount,
          sourceCurrency: result.conversion.sourceCurrency,
          targetAmount: result.conversion.targetAmount,
          targetCurrency: result.conversion.targetCurrency,
          conversionFee: result.conversion.conversionFee,
          exchangeRate: result.conversion.exchangeRate,
        },
        // Withdrawal details
        withdrawal: {
          withdrawalId: result.withdrawal.id,
          amount: result.withdrawal.amount,
          fee: result.withdrawal.transactionFee,
          address: result.withdrawal.address,
          network: dto.network,
          status: result.withdrawal.status,
          txId: result.withdrawal.txId || null,
          timestamp: result.withdrawal.applyTime,
        },
        // Final USDT wallet balance
        usdtWalletBalance: result.usdtWalletBalance,
      },
      message: `Successfully converted ${dto.amount} ${dto.fromCurrency} to USDT and initiated withdrawal to ${dto.address}`,
    };
  }

  @Get('withdrawal-status')
  @ApiOperation({ summary: 'Get withdrawal status' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal status retrieved successfully',
  })
  async getWithdrawalStatus(@Query('withdrawalId') withdrawalId: string) {
    const withdrawal =
      await this.binanceService.getWithdrawalStatus(withdrawalId);
    return {
      withdrawalId: withdrawal.id,
      amount: withdrawal.amount,
      fee: withdrawal.transactionFee,
      address: withdrawal.address,
      asset: withdrawal.asset,
      status: withdrawal.status,
      txId: withdrawal.txId || null,
      timestamp: withdrawal.applyTime,
      info: withdrawal.info,
    };
  }

  @Get('supported-pairs')
  @ApiOperation({ summary: 'Get all supported trading pairs' })
  @ApiResponse({
    status: 200,
    description: 'Supported pairs retrieved successfully',
  })
  async getSupportedPairs() {
    const pairs = await this.binanceService.getSupportedPairs();
    return {
      count: pairs.length,
      pairs,
    };
  }

  @Get('check-pair')
  @ApiOperation({ summary: 'Check if a trading pair is supported' })
  @ApiResponse({
    status: 200,
    description: 'Pair support checked successfully',
  })
  async checkPairSupport(@Query('symbol') symbol: string) {
    const isSupported = await this.binanceService.isPairSupported(symbol);
    return {
      symbol,
      supported: isSupported,
    };
  }
}
