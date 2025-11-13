import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { TransferTimelineService } from './services/transfer-timeline.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferResponseDto } from './dto/transfer-response.dto';
import { TransferTimelineDto } from './dto/transfer-timeline.dto';
import { TransferQueryDto } from './dto/transfer-query.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * TransfersController
 *
 * REST API endpoints for cross-border transfers
 *
 * All endpoints require authentication (Bearer token)
 * Business isolation enforced - users can only access their own business's transfers
 */
@ApiTags('Transfers')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('transfers')
export class TransfersController {
  constructor(
    private readonly transfersService: TransfersService,
    private readonly transferTimelineService: TransferTimelineService,
  ) {}

  /**
   * Initiate a new cross-border transfer
   *
   * Creates a transfer from KES wallet to Turkish beneficiary via USDT/TRON
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initiate cross-border transfer',
    description:
      'Initiates a transfer from KES wallet to Turkish beneficiary. ' +
      'Orchestrates: wallet debit → exchange rate calculation → USDT transfer via TRON → confirmation',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transfer initiated successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input (insufficient balance, inactive beneficiary, liquidity issues, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - beneficiary belongs to different business',
  })
  async initiateTransfer(
    @CurrentUser('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTransferDto,
  ): Promise<TransferResponseDto> {
    return await this.transfersService.initiateTransfer(businessId, userId, dto);
  }

  /**
   * Get transfer status by transaction ID
   */
  @Get(':transactionId')
  @ApiOperation({
    summary: 'Get transfer status',
    description: 'Retrieves detailed status of a specific transfer including current step',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'Transaction ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfer status retrieved successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transfer not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to this transfer',
  })
  async getTransferStatus(
    @CurrentUser('businessId') businessId: string,
    @Param('transactionId') transactionId: string,
  ): Promise<TransferResponseDto> {
    return await this.transfersService.getTransferStatus(transactionId, businessId);
  }

  /**
   * Get step-by-step timeline for a transfer
   */
  @Get(':transactionId/timeline')
  @ApiOperation({
    summary: 'Get transfer timeline',
    description:
      'Retrieves step-by-step progress timeline for a transfer. ' +
      'Shows all steps from initiation to completion/failure with timestamps and metadata.',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'Transaction ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfer timeline retrieved successfully',
    type: [TransferTimelineDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transfer not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to this transfer',
  })
  async getTransferTimeline(
    @CurrentUser('businessId') businessId: string,
    @Param('transactionId') transactionId: string,
  ): Promise<TransferTimelineDto[]> {
    return await this.transferTimelineService.getTimeline(transactionId, businessId);
  }

  /**
   * List all transfers for the authenticated business
   */
  @Get()
  @ApiOperation({
    summary: 'List transfers',
    description:
      'Retrieves a paginated list of transfers for the authenticated business. ' +
      'Supports filtering by status, beneficiary, and date range.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfers retrieved successfully',
    type: [TransferResponseDto],
  })
  async listTransfers(
    @CurrentUser('businessId') businessId: string,
    @Query() query: TransferQueryDto,
  ): Promise<TransferResponseDto[]> {
    return await this.transfersService.findByBusinessId(businessId, query);
  }
}
