import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from '../../database/entities/document.entity';
import { Business } from '../../database/entities/business.entity';
import { StorageModule } from '../storage';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Business]),
    StorageModule,
    EmailModule,
    AuditModule,
    AuthModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
