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
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BeneficiariesService } from './beneficiaries.service';
import {
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
  BeneficiaryResponseDto,
  BeneficiaryAdminResponseDto,
  BeneficiaryQueryDto,
} from './dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Beneficiaries Controller
 *
 * Handles HTTP endpoints for beneficiary management.
 * All endpoints require authentication and are business-isolated.
 *
 * Endpoints:
 * - POST   /beneficiaries           - Create beneficiary
 * - GET    /beneficiaries           - List all beneficiaries
 * - GET    /beneficiaries/:id       - Get single beneficiary
 * - PUT    /beneficiaries/:id       - Update beneficiary
 * - DELETE /beneficiaries/:id       - Delete beneficiary (soft)
 * - POST   /beneficiaries/:id/verify      - Mark as verified (admin only)
 * - POST   /beneficiaries/:id/activate    - Activate beneficiary
 * - POST   /beneficiaries/:id/deactivate  - Deactivate beneficiary
 * - POST   /beneficiaries/:id/restore     - Restore deleted beneficiary
 */
@ApiTags('Beneficiaries')
@ApiBearerAuth()
@Controller('beneficiaries')
@UseGuards(AuthGuard)
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  /**
   * Create a new beneficiary
   */
  @Post()
  @ApiOperation({
    summary: 'Create new beneficiary',
    description: 'Creates a new beneficiary with Turkish IBAN and TC Kimlik validation',
  })
  @ApiResponse({
    status: 201,
    description: 'Beneficiary created successfully',
    type: BeneficiaryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Duplicate IBAN' })
  async create(
    @CurrentUser('businessId') businessId: string,
    @Body() createBeneficiaryDto: CreateBeneficiaryDto,
  ): Promise<{ success: boolean; data: { beneficiary: BeneficiaryResponseDto } }> {
    const beneficiary = await this.beneficiariesService.create(
      businessId,
      createBeneficiaryDto,
    );
    return {
      success: true,
      data: { beneficiary: BeneficiaryResponseDto.fromEntity(beneficiary) },
    };
  }

  /**
   * Get all beneficiaries for the authenticated user's business
   */
  @Get()
  @ApiOperation({
    summary: 'List beneficiaries',
    description: 'Returns all beneficiaries for the authenticated user\'s business',
  })
  @ApiResponse({
    status: 200,
    description: 'Beneficiaries retrieved successfully',
    type: [BeneficiaryResponseDto],
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'isVerified',
    required: false,
    type: Boolean,
    description: 'Filter by verified status',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted beneficiaries (admin only)',
  })
  async findAll(
    @CurrentUser('businessId') businessId: string,
    @Query() query: BeneficiaryQueryDto,
  ): Promise<{ success: boolean; data: { beneficiaries: BeneficiaryResponseDto[] } }> {
    const beneficiaries = await this.beneficiariesService.findAll(
      businessId,
      query,
    );
    return {
      success: true,
      data: { beneficiaries: BeneficiaryResponseDto.fromEntities(beneficiaries) },
    };
  }

  /**
   * Get a single beneficiary by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get beneficiary',
    description: 'Returns a single beneficiary by ID',
  })
  @ApiParam({ name: 'id', description: 'Beneficiary UUID' })
  @ApiResponse({
    status: 200,
    description: 'Beneficiary retrieved successfully',
    type: BeneficiaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong business' })
  async findOne(
    @CurrentUser('businessId') businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; data: { beneficiary: BeneficiaryResponseDto } }> {
    const beneficiary = await this.beneficiariesService.findOne(id, businessId);
    return {
      success: true,
      data: { beneficiary: BeneficiaryResponseDto.fromEntity(beneficiary) },
    };
  }

  /**
   * Get a single beneficiary by ID (admin view with sensitive data)
   */
  @Get(':id/admin')
  @UseGuards(SuperAdminGuard)
  @SuperAdmin()
  @ApiOperation({
    summary: 'Get beneficiary (admin view)',
    description: 'Returns a single beneficiary with sensitive information (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Beneficiary UUID' })
  @ApiResponse({
    status: 200,
    description: 'Beneficiary retrieved successfully',
    type: BeneficiaryAdminResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async findOneAdmin(
    @CurrentUser('businessId') businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BeneficiaryAdminResponseDto> {
    const beneficiary = await this.beneficiariesService.findOne(id, businessId);
    return BeneficiaryAdminResponseDto.fromEntity(beneficiary);
  }

  /**
   * Update a beneficiary
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update beneficiary',
    description: 'Updates an existing beneficiary',
  })
  @ApiParam({ name: 'id', description: 'Beneficiary UUID' })
  @ApiResponse({
    status: 200,
    description: 'Beneficiary updated successfully',
    type: BeneficiaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Duplicate IBAN' })
  async update(
    @CurrentUser('businessId') businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBeneficiaryDto: UpdateBeneficiaryDto,
  ): Promise<{ success: boolean; data: { beneficiary: BeneficiaryResponseDto } }> {
    const beneficiary = await this.beneficiariesService.update(
      id,
      businessId,
      updateBeneficiaryDto,
    );
    return {
      success: true,
      data: { beneficiary: BeneficiaryResponseDto.fromEntity(beneficiary) },
    };
  }

  /**
   * Soft delete a beneficiary
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete beneficiary',
    description: 'Soft deletes a beneficiary (can be restored later)',
  })
  @ApiParam({ name: 'id', description: 'Beneficiary UUID' })
  @ApiResponse({ status: 204, description: 'Beneficiary deleted successfully' })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  async delete(
    @CurrentUser('businessId') businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.beneficiariesService.delete(id, businessId);
  }

  /**
   * Mark beneficiary as verified (admin only)
   */
  @Post(':id/verify')
  @UseGuards(SuperAdminGuard)
  @SuperAdmin()
  @ApiOperation({
    summary: 'Verify beneficiary',
    description: 'Marks a beneficiary as verified (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Beneficiary UUID' })
  @ApiResponse({
    status: 200,
    description: 'Beneficiary verified successfully',
    type: BeneficiaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async verify(
    @CurrentUser('businessId') businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; data: { beneficiary: BeneficiaryResponseDto } }> {
    const beneficiary = await this.beneficiariesService.markAsVerified(
      id,
      businessId,
    );
    return {
      success: true,
      data: { beneficiary: BeneficiaryResponseDto.fromEntity(beneficiary) },
    };
  }

  /**
   * Activate a beneficiary
   */
  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate beneficiary',
    description: 'Activates an inactive beneficiary',
  })
  @ApiParam({ name: 'id', description: 'Beneficiary UUID' })
  @ApiResponse({
    status: 200,
    description: 'Beneficiary activated successfully',
    type: BeneficiaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  async activate(
    @CurrentUser('businessId') businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; data: { beneficiary: BeneficiaryResponseDto } }> {
    const beneficiary = await this.beneficiariesService.activate(id, businessId);
    return {
      success: true,
      data: { beneficiary: BeneficiaryResponseDto.fromEntity(beneficiary) },
    };
  }

  /**
   * Deactivate a beneficiary
   */
  @Post(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate beneficiary',
    description: 'Deactivates an active beneficiary (soft disable)',
  })
  @ApiParam({ name: 'id', description: 'Beneficiary UUID' })
  @ApiResponse({
    status: 200,
    description: 'Beneficiary deactivated successfully',
    type: BeneficiaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  async deactivate(
    @CurrentUser('businessId') businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; data: { beneficiary: BeneficiaryResponseDto } }> {
    const beneficiary = await this.beneficiariesService.deactivate(id, businessId);
    return {
      success: true,
      data: { beneficiary: BeneficiaryResponseDto.fromEntity(beneficiary) },
    };
  }

  /**
   * Restore a soft-deleted beneficiary
   */
  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restore beneficiary',
    description: 'Restores a previously soft-deleted beneficiary',
  })
  @ApiParam({ name: 'id', description: 'Beneficiary UUID' })
  @ApiResponse({
    status: 200,
    description: 'Beneficiary restored successfully',
    type: BeneficiaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Beneficiary not found' })
  @ApiResponse({ status: 400, description: 'Beneficiary is not deleted' })
  async restore(
    @CurrentUser('businessId') businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; data: { beneficiary: BeneficiaryResponseDto } }> {
    const beneficiary = await this.beneficiariesService.restore(id, businessId);
    return {
      success: true,
      data: { beneficiary: BeneficiaryResponseDto.fromEntity(beneficiary) },
    };
  }

  /**
   * Get beneficiary count
   */
  @Get('stats/count')
  @ApiOperation({
    summary: 'Get beneficiary count',
    description: 'Returns the count of beneficiaries for the authenticated user\'s business',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'isVerified',
    required: false,
    type: Boolean,
    description: 'Filter by verified status',
  })
  @ApiResponse({
    status: 200,
    description: 'Count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 42 },
      },
    },
  })
  async count(
    @CurrentUser('businessId') businessId: string,
    @Query() query: Pick<BeneficiaryQueryDto, 'isActive' | 'isVerified'>,
  ): Promise<{ count: number }> {
    const count = await this.beneficiariesService.count(businessId, query);
    return { count };
  }
}
