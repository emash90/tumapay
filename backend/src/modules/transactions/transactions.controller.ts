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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { BusinessVerifiedGuard } from '../business/guards/business-verified.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { Business } from '../../database/entities/business.entity';
import { BusinessService } from '../business/business.service';
import { CreateTransactionDto, TransactionResponseDto } from './dto';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AuthGuard)
@ApiBearerAuth('bearer')
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private businessService: BusinessService,
  ) {}

  @Post()
  @UseGuards(BusinessVerifiedGuard) // Ensure business is KYB verified
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new transaction',
    description: 'Create a new transaction for the authenticated user\'s verified business. Business must have completed KYB verification.',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Business not verified',
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: User,
    @Req() request: Request & { business: Business },
  ) {
    // Business is already attached to request by BusinessVerifiedGuard
    const business = request.business;

    // Create transaction
    const transaction = await this.transactionsService.createTransaction(
      createTransactionDto,
      business.id,
      user.id,
    );

    return {
      success: true,
      message: 'Transaction created successfully',
      data: { transaction },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transaction by ID',
    description: 'Retrieve a specific transaction by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your transaction',
  })
  async getTransaction(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    const transaction = await this.transactionsService.findById(id);

    // Authorization check - only business owner or super admin can view
    if (transaction.userId !== user.id && !user.isSuperAdmin) {
      throw new ForbiddenException('You do not have permission to view this transaction');
    }

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
    // Get user's business
    const business = await this.businessService.getBusinessByUserId(user.id);

    if (!business) {
      return {
        success: true,
        data: { transactions: [] },
      };
    }

    // Fetch all transactions for the business
    const transactions = await this.transactionsService.findByBusinessId(business.id);

    return {
      success: true,
      data: { transactions },
    };
  }
}
