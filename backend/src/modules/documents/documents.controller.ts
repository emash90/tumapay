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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, VerifyDocumentDto, DocumentResponseDto, BusinessDocumentSummaryDto } from './dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Upload a document for a business
   * POST /api/v1/documents/business/:businessId
   */
  @Post('business/:businessId')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads per minute
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ): Promise<{ message: string; document: DocumentResponseDto }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const document = await this.documentsService.uploadDocument(businessId, userId, file, dto);

    return {
      message: 'Document uploaded successfully',
      document: new DocumentResponseDto(document),
    };
  }

  /**
   * Get all documents for a business
   * GET /api/v1/documents/business/:businessId
   */
  @Get('business/:businessId')
  async getBusinessDocuments(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ documents: DocumentResponseDto[] }> {
    const documents = await this.documentsService.getBusinessDocuments(businessId, userId);

    return {
      documents: documents.map((doc) => new DocumentResponseDto(doc)),
    };
  }

  /**
   * Get business document summary
   * GET /api/v1/documents/business/:businessId/summary
   */
  @Get('business/:businessId/summary')
  async getBusinessDocumentSummary(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @CurrentUser('id') userId: string,
  ): Promise<BusinessDocumentSummaryDto> {
    const summary = await this.documentsService.getBusinessDocumentSummary(businessId, userId);

    return new BusinessDocumentSummaryDto(summary);
  }

  /**
   * Get a specific document
   * GET /api/v1/documents/:documentId
   */
  @Get(':documentId')
  async getDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ document: DocumentResponseDto }> {
    const document = await this.documentsService.getDocument(documentId, userId);

    return {
      document: new DocumentResponseDto(document),
    };
  }

  /**
   * Delete a document
   * DELETE /api/v1/documents/:documentId
   */
  @Delete(':documentId')
  @HttpCode(HttpStatus.OK)
  async deleteDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.documentsService.deleteDocument(documentId, userId);

    return {
      message: 'Document deleted successfully',
    };
  }

  /**
   * Replace a document
   * PUT /api/v1/documents/:documentId/replace
   */
  @Put(':documentId/replace')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads per minute
  @UseInterceptors(FileInterceptor('file'))
  async replaceDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string; document: DocumentResponseDto }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const document = await this.documentsService.replaceDocument(documentId, userId, file);

    return {
      message: 'Document replaced successfully',
      document: new DocumentResponseDto(document),
    };
  }

  /**
   * Verify a document (Admin only)
   * PUT /api/v1/documents/:documentId/verify
   */
  @Put(':documentId/verify')
  @HttpCode(HttpStatus.OK)
  async verifyDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser('id') adminUserId: string,
    @Body() dto: VerifyDocumentDto,
  ): Promise<{ message: string; document: DocumentResponseDto }> {
    // TODO: Add admin guard to verify user is admin
    const document = await this.documentsService.verifyDocument(documentId, adminUserId, dto);

    return {
      message: 'Document verified successfully',
      document: new DocumentResponseDto(document),
    };
  }
}
