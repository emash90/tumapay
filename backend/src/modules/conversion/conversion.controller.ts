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
  ApiQuery,
} from '@nestjs/swagger';
import { ConversionService } from './conversion.service';
import { ConversionQuoteDto } from './dto/conversion-quote.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { ConversionQuoteResponseDto } from './dto/conversion-quote-response.dto';
import { ConversionResponseDto } from './dto/conversion-response.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { BusinessVerifiedGuard } from '../business/guards/business-verified.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('Conversion')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, BusinessVerifiedGuard)
@Controller('conversion')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get conversion quote',
    description: 'Get a preview of conversion with exchange rate and fees without executing',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion quote retrieved successfully',
    type: ConversionQuoteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getQuote(
    @CurrentUser() user: User,
    @Body() quoteDto: ConversionQuoteDto,
  ): Promise<ConversionQuoteResponseDto> {
    const businessId = (user as any).businessId;
    return await this.conversionService.getConversionQuote(businessId, quoteDto);
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute currency conversion',
    description: 'Convert currency between wallets with automatic fee calculation',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion executed successfully',
    type: ConversionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or insufficient balance',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async executeConversion(
    @CurrentUser() user: User,
    @Body() conversionDto: ConvertCurrencyDto,
  ): Promise<ConversionResponseDto> {
    const businessId = (user as any).businessId;
    const userId = user.id;
    return await this.conversionService.executeConversion(
      businessId,
      userId,
      conversionDto,
    );
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get conversion history',
    description: 'Retrieve conversion transaction history for the business',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records to return (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of records to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion history retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getHistory(
    @CurrentUser() user: User,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    const businessId = (user as any).businessId;
    return await this.conversionService.getConversionHistory(
      businessId,
      Number(limit),
      Number(offset),
    );
  }

  @Get(':transactionId')
  @ApiOperation({
    summary: 'Get conversion details',
    description: 'Retrieve details of a specific conversion transaction',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversion not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getConversion(
    @CurrentUser() user: User,
    @Param('transactionId') transactionId: string,
  ) {
    const businessId = (user as any).businessId;
    return await this.conversionService.getConversion(businessId, transactionId);
  }
}
