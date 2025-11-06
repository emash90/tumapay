import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { FeeConfigService } from './services/fee-config.service';
import { CreateFeeConfigDto } from './dto/create-fee-config.dto';
import { UpdateFeeConfigDto } from './dto/update-fee-config.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { BusinessVerifiedGuard } from '../business/guards/business-verified.guard';

@ApiTags('Conversion Admin')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, BusinessVerifiedGuard)
@Controller('admin/conversion/fee-config')
export class ConversionAdminController {
  constructor(private readonly feeConfigService: FeeConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all fee configurations',
    description: 'Retrieve all conversion fee configurations',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to active configs only',
  })
  @ApiResponse({
    status: 200,
    description: 'Fee configurations retrieved successfully',
  })
  async getAllFeeConfigs(@Query('activeOnly') activeOnly = true) {
    return await this.feeConfigService.getAllFeeConfigs(activeOnly === true);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create fee configuration',
    description: 'Create a new conversion fee configuration',
  })
  @ApiResponse({
    status: 201,
    description: 'Fee configuration created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  async createFeeConfig(@Body() createDto: CreateFeeConfigDto) {
    return await this.feeConfigService.upsertFeeConfig(
      createDto.fromCurrency,
      createDto.toCurrency,
      createDto,
    );
  }

  @Put(':fromCurrency/:toCurrency')
  @ApiOperation({
    summary: 'Update fee configuration',
    description: 'Update an existing fee configuration by currency pair',
  })
  @ApiResponse({
    status: 200,
    description: 'Fee configuration updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Fee configuration not found',
  })
  async updateFeeConfig(
    @Param('fromCurrency') fromCurrency: string,
    @Param('toCurrency') toCurrency: string,
    @Body() updateDto: UpdateFeeConfigDto,
  ) {
    return await this.feeConfigService.upsertFeeConfig(
      fromCurrency,
      toCurrency,
      updateDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete fee configuration',
    description: 'Delete a fee configuration by ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Fee configuration deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Fee configuration not found',
  })
  async deleteFeeConfig(@Param('id') id: string) {
    await this.feeConfigService.deleteFeeConfig(id);
  }

  @Get('find/:fromCurrency/:toCurrency')
  @ApiOperation({
    summary: 'Find fee configuration for currency pair',
    description: 'Find the best matching fee configuration with wildcard support',
  })
  @ApiResponse({
    status: 200,
    description: 'Fee configuration found',
  })
  @ApiResponse({
    status: 404,
    description: 'No matching fee configuration found',
  })
  async findFeeConfig(
    @Param('fromCurrency') fromCurrency: string,
    @Param('toCurrency') toCurrency: string,
  ) {
    const config = await this.feeConfigService.findFeeConfig(
      fromCurrency,
      toCurrency,
    );

    if (!config) {
      return {
        message: 'No fee configuration found, using defaults',
        config: this.feeConfigService.getDefaultFeeConfig(),
      };
    }

    return config;
  }
}
