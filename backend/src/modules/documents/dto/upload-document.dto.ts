import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { DocumentType } from '../../../database/entities/document.entity';

export class UploadDocumentDto {
  @Transform(({ value }) => value?.trim())
  @IsEnum(DocumentType, {
    message: 'Invalid document type. Please select a valid document type.',
  })
  documentType: DocumentType;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;
}
