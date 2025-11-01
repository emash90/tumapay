import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { UpdateBusinessDto, BusinessResponseDto } from './dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('business')
@Controller('businesses')
@UseGuards(AuthGuard)
@ApiBearerAuth('bearer')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get my business',
    description: 'Retrieve the business profile for the current authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Business retrieved successfully',
    type: BusinessResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyBusiness(@CurrentUser() user: User) {
    const business = await this.businessService.getBusinessByUserId(user.id);

    if (!business) {
      throw new NotFoundException(
        'No business profile found for this user. Please contact support.',
      );
    }

    return {
      success: true,
      data: { business },
    };
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update my business',
    description: 'Update business profile information for the current authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Business updated successfully',
    type: BusinessResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateMyBusiness(
    @CurrentUser() user: User,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    const business = await this.businessService.updateBusiness(
      user.id,
      updateBusinessDto,
    );

    return {
      success: true,
      message: 'Business updated successfully',
      data: { business },
    };
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete my business',
    description: 'Soft delete the business profile (can be restored by admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Business deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async deleteMyBusiness(@CurrentUser() user: User) {
    await this.businessService.deleteBusiness(user.id);

    return {
      success: true,
      message: 'Business deleted successfully',
    };
  }

  /**
   * TEMPORARY: Manual verification endpoint for testing
   * TODO: Remove this endpoint before production deployment
   */
  @Post('me/verify-manual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[TESTING ONLY] Manually verify business KYB status',
    description: 'TEMPORARY endpoint to manually verify business KYB status for testing purposes. Bypasses KYB provider verification. MUST BE REMOVED BEFORE PRODUCTION.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business verified successfully',
    type: BusinessResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async verifyBusinessManually(@CurrentUser() user: User) {
    const business = await this.businessService.getBusinessByUserId(user.id);

    if (!business) {
      throw new NotFoundException(
        'No business profile found for this user. Please contact support.',
      );
    }

    const verifiedBusiness = await this.businessService.verifyBusinessManually(
      business.id,
    );

    return {
      success: true,
      message: 'Business verified manually (TESTING ONLY)',
      data: { business: verifiedBusiness },
    };
  }
}
