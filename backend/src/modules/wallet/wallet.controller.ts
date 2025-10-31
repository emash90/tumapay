import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { BusinessVerifiedGuard } from '../business/guards/business-verified.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { Business } from '../../database/entities/business.entity';
import { BusinessService } from '../business/business.service';
import { WalletCurrency } from '../../database/entities/wallet.entity';
import { WalletTransactionType } from '../../database/entities/wallet-transaction.entity';

@ApiTags('wallets')
@Controller('wallets')
@UseGuards(AuthGuard)
@ApiBearerAuth('bearer')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private businessService: BusinessService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all wallets for business',
    description: 'Retrieve all active wallets (multi-currency) for the authenticated user\'s business',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallets retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  async getBusinessWallets(@CurrentUser() user: User) {
    const business = await this.businessService.getBusinessByUserId(user.id);

    if (!business) {
      return {
        success: true,
        data: { wallets: [] },
      };
    }

    const wallets = await this.walletService.getBusinessWallets(business.id);

    return {
      success: true,
      data: { wallets },
    };
  }

  @Get(':walletId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get wallet by ID',
    description: 'Retrieve a specific wallet by its ID',
  })
  @ApiParam({ name: 'walletId', description: 'Wallet UUID' })
  @ApiResponse({
    status: 200,
    description: 'Wallet retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your wallet',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async getWallet(
    @Param('walletId') walletId: string,
    @CurrentUser() user: User,
  ) {
    const wallet = await this.walletService.getWalletById(walletId);
    const business = await this.businessService.getBusinessByUserId(user.id);

    // Authorization check - only business owner or super admin can view
    if (wallet.businessId !== business?.id && !user.isSuperAdmin) {
      throw new ForbiddenException('You do not have permission to view this wallet');
    }

    return {
      success: true,
      data: { wallet },
    };
  }

  @Get('balance/:currency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get wallet balance for specific currency',
    description: 'Get available balance for a specific currency wallet. Creates wallet if it doesn\'t exist.',
  })
  @ApiParam({
    name: 'currency',
    enum: WalletCurrency,
    description: 'Currency code (KES, USDT, TRY, USD)'
  })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  async getBalance(
    @Param('currency') currency: WalletCurrency,
    @CurrentUser() user: User,
  ) {
    const business = await this.businessService.getBusinessByUserId(user.id);

    if (!business) {
      throw new ForbiddenException('No business associated with your account');
    }

    const balance = await this.walletService.getBalance(business.id, currency);

    return {
      success: true,
      data: {
        businessId: business.id,
        currency,
        availableBalance: balance,
      },
    };
  }

  @Get(':walletId/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get wallet transaction history',
    description: 'Retrieve transaction history for a specific wallet',
  })
  @ApiParam({ name: 'walletId', description: 'Wallet UUID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions to retrieve (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your wallet',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async getWalletHistory(
    @Param('walletId') walletId: string,
    @Query('limit') limit: number = 50,
    @CurrentUser() user: User,
  ) {
    const wallet = await this.walletService.getWalletById(walletId);
    const business = await this.businessService.getBusinessByUserId(user.id);

    // Authorization check
    if (wallet.businessId !== business?.id && !user.isSuperAdmin) {
      throw new ForbiddenException('You do not have permission to view this wallet history');
    }

    const history = await this.walletService.getWalletHistory(walletId, limit);

    return {
      success: true,
      data: {
        wallet: {
          id: wallet.id,
          currency: wallet.currency,
          availableBalance: wallet.availableBalance,
        },
        history,
      },
    };
  }

  @Post(':walletId/credit')
  @UseGuards(BusinessVerifiedGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Credit wallet (add funds)',
    description: 'Add funds to a wallet. Requires verified business. This is an atomic operation.',
  })
  @ApiParam({ name: 'walletId', description: 'Wallet UUID' })
  @ApiResponse({
    status: 200,
    description: 'Wallet credited successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid amount',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Business not verified or not your wallet',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async creditWallet(
    @Param('walletId') walletId: string,
    @Body() body: {
      amount: number;
      description: string;
      transactionId?: string;
      metadata?: Record<string, any>;
    },
    @CurrentUser() user: User,
    @Req() request: Request & { business: Business },
  ) {
    const wallet = await this.walletService.getWalletById(walletId);

    // Authorization check - wallet must belong to user's business
    if (wallet.businessId !== request.business.id) {
      throw new ForbiddenException('You do not have permission to credit this wallet');
    }

    const updatedWallet = await this.walletService.creditWallet(
      walletId,
      body.amount,
      WalletTransactionType.DEPOSIT,
      body.description,
      body.transactionId,
      body.metadata,
    );

    return {
      success: true,
      message: 'Wallet credited successfully',
      data: { wallet: updatedWallet },
    };
  }

  @Post(':walletId/debit')
  @UseGuards(BusinessVerifiedGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Debit wallet (deduct funds)',
    description: 'Deduct funds from a wallet. Requires verified business. This is an atomic operation.',
  })
  @ApiParam({ name: 'walletId', description: 'Wallet UUID' })
  @ApiResponse({
    status: 200,
    description: 'Wallet debited successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid amount or insufficient balance',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Business not verified or not your wallet',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async debitWallet(
    @Param('walletId') walletId: string,
    @Body() body: {
      amount: number;
      description: string;
      transactionId?: string;
      metadata?: Record<string, any>;
    },
    @CurrentUser() user: User,
    @Req() request: Request & { business: Business },
  ) {
    const wallet = await this.walletService.getWalletById(walletId);

    // Authorization check
    if (wallet.businessId !== request.business.id) {
      throw new ForbiddenException('You do not have permission to debit this wallet');
    }

    const updatedWallet = await this.walletService.debitWallet(
      walletId,
      body.amount,
      WalletTransactionType.WITHDRAWAL,
      body.description,
      body.transactionId,
      body.metadata,
    );

    return {
      success: true,
      message: 'Wallet debited successfully',
      data: { wallet: updatedWallet },
    };
  }

  @Post(':walletId/lock')
  @UseGuards(BusinessVerifiedGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lock balance (move to pending)',
    description: 'Lock funds by moving from available to pending balance. Used for pending transactions.',
  })
  @ApiParam({ name: 'walletId', description: 'Wallet UUID' })
  @ApiResponse({
    status: 200,
    description: 'Balance locked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid amount or insufficient balance',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Business not verified or not your wallet',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async lockBalance(
    @Param('walletId') walletId: string,
    @Body() body: { amount: number },
    @CurrentUser() user: User,
    @Req() request: Request & { business: Business },
  ) {
    const wallet = await this.walletService.getWalletById(walletId);

    // Authorization check
    if (wallet.businessId !== request.business.id) {
      throw new ForbiddenException('You do not have permission to lock balance in this wallet');
    }

    const updatedWallet = await this.walletService.lockBalance(walletId, body.amount);

    return {
      success: true,
      message: 'Balance locked successfully',
      data: { wallet: updatedWallet },
    };
  }

  @Post(':walletId/unlock')
  @UseGuards(BusinessVerifiedGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlock balance (move back to available)',
    description: 'Unlock funds by moving from pending back to available balance. Used when transactions are cancelled.',
  })
  @ApiParam({ name: 'walletId', description: 'Wallet UUID' })
  @ApiResponse({
    status: 200,
    description: 'Balance unlocked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid amount or insufficient pending balance',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Business not verified or not your wallet',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async unlockBalance(
    @Param('walletId') walletId: string,
    @Body() body: { amount: number },
    @CurrentUser() user: User,
    @Req() request: Request & { business: Business },
  ) {
    const wallet = await this.walletService.getWalletById(walletId);

    // Authorization check
    if (wallet.businessId !== request.business.id) {
      throw new ForbiddenException('You do not have permission to unlock balance in this wallet');
    }

    const updatedWallet = await this.walletService.unlockBalance(walletId, body.amount);

    return {
      success: true,
      message: 'Balance unlocked successfully',
      data: { wallet: updatedWallet },
    };
  }
}
