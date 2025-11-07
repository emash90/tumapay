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
  ConvertToUSDTDto,
  ConvertFromUSDTDto,
  WithdrawUSDTDto,
} from './dto/convert-to-usdt.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

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

  @Post('convert-to-usdt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert fiat currency to USDT',
    description:
      '⚠️ WARNING: This endpoint does not work as designed. Binance does not support fiat currency pairs. ' +
      'For fiat-to-USDT conversions, use the Exchange Rate service to get fiat rates, then calculate USDT equivalent (1 USD ≈ 1 USDT). ' +
      'See BINANCE_USAGE.md for proper implementation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion to USDT successful',
  })
  async convertToUSDT(@Body() dto: ConvertToUSDTDto) {
    const result = await this.binanceService.convertToUSDT(dto);
    return {
      success: true,
      data: {
        sourceAmount: dto.amount,
        sourceCurrency: dto.fromCurrency,
        targetAmount: result.usdtAmount,
        targetCurrency: 'USDT',
        exchangeRate: result.exchangeRate,
        orderId: result.order.orderId,
        timestamp: result.order.transactTime,
      },
    };
  }

  @Post('convert-from-usdt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert USDT to fiat currency',
    description:
      '⚠️ WARNING: This endpoint does not work as designed. Binance does not support fiat currency pairs. ' +
      'For USDT-to-fiat conversions, calculate fiat equivalent (1 USDT ≈ 1 USD), then use Exchange Rate service for final currency. ' +
      'See BINANCE_USAGE.md for proper implementation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion from USDT successful',
  })
  async convertFromUSDT(@Body() dto: ConvertFromUSDTDto) {
    const result = await this.binanceService.convertFromUSDT(dto);
    return {
      success: true,
      data: {
        sourceAmount: dto.amount,
        sourceCurrency: 'USDT',
        targetAmount: result.fiatAmount,
        targetCurrency: dto.toCurrency,
        exchangeRate: result.exchangeRate,
        orderId: result.order.orderId,
        timestamp: result.order.transactTime,
      },
    };
  }

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
  async withdrawUSDT(@Body() dto: WithdrawUSDTDto) {
    const withdrawal = await this.binanceService.withdrawUSDT(dto);
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
