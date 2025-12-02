import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { DocumentStatus } from '../../../database/entities/document.entity';

export class VerifyDocumentDto {
  @IsEnum(DocumentStatus, {
    message: 'Invalid document status',
  })
  status: DocumentStatus;

  @ValidateIf((o) => o.status === DocumentStatus.REJECTED)
  @IsString()
  rejectionReason?: string;
}
