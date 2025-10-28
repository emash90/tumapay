import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AuthGuard)
@ApiBearerAuth('bearer')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transaction by ID',
    description: 'Retrieve a specific transaction by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getTransaction(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    const transaction = await this.transactionsService.findById(id);

    // TODO: Add authorization check - only business owner or super admin can view

    return {
      success: true,
      data: { transaction },
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all transactions',
    description: 'Retrieve all transactions for the authenticated user\'s business',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getTransactions(@CurrentUser() user: User) {
    // TODO: Get user's business and fetch transactions
    // For now, returning empty array as placeholder
    const transactions = await this.transactionsService.findByUserId(user.id);

    return {
      success: true,
      data: { transactions },
    };
  }
}
