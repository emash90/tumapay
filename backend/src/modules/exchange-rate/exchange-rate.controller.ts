import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExchangeRateService } from './exchange-rate.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('Exchange Rates')
@Controller('exchange-rates')
@UseGuards(AuthGuard)
@ApiBearerAuth('bearer')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get(':from/:to')
  @ApiOperation({ summary: 'Get exchange rate between two currencies' })
  @ApiParam({ name: 'from', example: 'KES' })
  @ApiParam({ name: 'to', example: 'USDT' })
  @ApiResponse({
    status: 200,
    description: 'Exchange rate retrieved successfully',
  })
  async getRate(@Param('from') from: string, @Param('to') to: string) {
    const rate = await this.exchangeRateService.getExchangeRate(
      from.toUpperCase(),
      to.toUpperCase(),
    );

    return {
      success: true,
      data: rate,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all available exchange rates' })
  @ApiResponse({
    status: 200,
    description: 'All exchange rates retrieved successfully',
  })
  async getAllRates() {
    const rates = await this.exchangeRateService.getAllRates();

    return {
      success: true,
      data: rates,
    };
  }
}
