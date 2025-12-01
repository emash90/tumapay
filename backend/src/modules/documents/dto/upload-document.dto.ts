import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '../../../database/entities/document.entity';

export class UploadDocumentDto {
  @IsEnum(DocumentType, {
    message: 'Invalid document type',
  })
  documentType: DocumentType;

  @IsOptional()
  @IsString()
  description?: string;
}
