import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { CloudinaryProvider } from '../../config/cloudinary.config';

@Module({
  providers: [CloudinaryProvider, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
