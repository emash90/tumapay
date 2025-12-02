import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, VerifyDocumentDto, DocumentResponseDto, BusinessDocumentSummaryDto } from './dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Documents Controller
 *
 * Handles HTTP endpoints for KYB document management.
 * All endpoints require authentication and are business-isolated.
 *
 * Endpoints:
 * - POST   /documents/business/:businessId           - Upload document
 * - GET    /documents/business/:businessId           - List business documents
 * - GET    /documents/business/:businessId/summary   - Get document summary
 * - GET    /documents/:documentId                    - Get single document
 * - DELETE /documents/:documentId                    - Delete document
 * - PUT    /documents/:documentId/replace            - Replace document
 * - PUT    /documents/:documentId/verify             - Verify document (admin only)
 */
@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Upload a document for a business
   */
  @Post('business/:businessId')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads per minute
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false, // Allow extra fields for multipart/form-data
    transformOptions: {
      enableImplicitConversion: true,
    },
  }))
  @ApiOperation({
    summary: 'Upload KYB document',
    description: 'Uploads a document for business verification. Supports PDF, JPG, and PNG files up to 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'File is required or invalid document type' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your business' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 409, description: 'Document type already exists' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async uploadDocument(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ): Promise<{ success: boolean; message: string; data: { document: DocumentResponseDto } }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const document = await this.documentsService.uploadDocument(businessId, userId, file, dto);

    return {
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: new DocumentResponseDto(document),
      },
    };
  }

  /**
   * Get all documents for a business
   */
  @Get('business/:businessId')
  @ApiOperation({
    summary: 'List business documents',
    description: 'Returns all documents uploaded for the specified business',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: [DocumentResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your business' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getBusinessDocuments(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean; data: { documents: DocumentResponseDto[] } }> {
    const documents = await this.documentsService.getBusinessDocuments(businessId, userId);

    return {
      success: true,
      data: {
        documents: documents.map((doc) => new DocumentResponseDto(doc)),
      },
    };
  }

  /**
   * Get business document summary
   */
  @Get('business/:businessId/summary')
  @ApiOperation({
    summary: 'Get document summary',
    description: 'Returns statistics and progress for business KYB documents',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Summary retrieved successfully',
    type: BusinessDocumentSummaryDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your business' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getBusinessDocumentSummary(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean; data: BusinessDocumentSummaryDto }> {
    const summary = await this.documentsService.getBusinessDocumentSummary(businessId, userId);

    return {
      success: true,
      data: new BusinessDocumentSummaryDto({
        ...summary,
        businessType: summary.businessType ?? undefined,
      }),
    };
  }

  /**
   * Get a specific document
   */
  @Get(':documentId')
  @ApiOperation({
    summary: 'Get document',
    description: 'Returns a single document by ID',
  })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your business' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean; data: { document: DocumentResponseDto } }> {
    const document = await this.documentsService.getDocument(documentId, userId);

    return {
      success: true,
      data: {
        document: new DocumentResponseDto(document),
      },
    };
  }

  /**
   * Delete a document
   */
  @Delete(':documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Deletes a document and removes it from storage',
  })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your business' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean; message: string; data: Record<string, never> }> {
    await this.documentsService.deleteDocument(documentId, userId);

    return {
      success: true,
      message: 'Document deleted successfully',
      data: {},
    };
  }

  /**
   * Replace a document
   */
  @Put(':documentId/replace')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads per minute
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false, // Allow extra fields for multipart/form-data
    transformOptions: {
      enableImplicitConversion: true,
    },
  }))
  @ApiOperation({
    summary: 'Replace document',
    description: 'Replaces an existing document with a new file. Useful for rejected documents.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document replaced successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'File is required' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your business' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async replaceDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string; data: { document: DocumentResponseDto } }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const document = await this.documentsService.replaceDocument(documentId, userId, file);

    return {
      success: true,
      message: 'Document replaced successfully',
      data: {
        document: new DocumentResponseDto(document),
      },
    };
  }

  /**
   * Verify a document (Admin only)
   */
  @Put(':documentId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify document (Admin)',
    description: 'Approves or rejects a document. Admin only endpoint.',
  })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document verified successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid verification data' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async verifyDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser('id') adminUserId: string,
    @Body() dto: VerifyDocumentDto,
  ): Promise<{ success: boolean; message: string; data: { document: DocumentResponseDto } }> {
    // TODO: Add admin guard to verify user is admin
    const document = await this.documentsService.verifyDocument(documentId, adminUserId, dto);

    return {
      success: true,
      message: 'Document verified successfully',
      data: {
        document: new DocumentResponseDto(document),
      },
    };
  }
}
