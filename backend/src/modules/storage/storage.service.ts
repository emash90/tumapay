import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, UploadApiErrorResponse, v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_PROVIDER } from '../../config/cloudinary.config';
import { IStorageService, UploadResult } from './interfaces/storage.interface';
import * as streamifier from 'streamifier';

/**
 * CloudinaryStorageService
 * Implementation of IStorageService using Cloudinary
 * Can be easily replaced with AWS S3 implementation in the future
 */
@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadFolder: string;

  constructor(
    @Inject(CLOUDINARY_PROVIDER) private readonly cloudinaryInstance: typeof cloudinary,
    private readonly configService: ConfigService,
  ) {
    this.uploadFolder = this.configService.get<string>('CLOUDINARY_UPLOAD_FOLDER') || 'tumapay/kyb-documents';
  }

  /**
   * Upload file to Cloudinary
   * @param file - File buffer from multer
   * @param folder - Optional subfolder (will be appended to base folder)
   * @returns Upload result with public ID and URLs
   */
  async uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult> {
    try {
      const uploadFolder = folder ? `${this.uploadFolder}/${folder}` : this.uploadFolder;

      this.logger.log(`Uploading file to Cloudinary: ${file.originalname} (${file.size} bytes)`);

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = this.cloudinaryInstance.uploader.upload_stream(
          {
            folder: uploadFolder,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
          },
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              this.logger.error(`Cloudinary upload error: ${error.message}`, error);
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Upload failed: No result returned'));
            }
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });

      this.logger.log(`File uploaded successfully: ${result.public_id}`);

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        format: result.format,
        bytes: result.bytes,
        folder: uploadFolder,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to Cloudinary', error);
      throw new BadRequestException('Failed to upload file. Please try again.');
    }
  }

  /**
   * Delete file from Cloudinary
   * @param publicId - Public ID of the file to delete
   * @returns Deletion result
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      this.logger.log(`Deleting file from Cloudinary: ${publicId}`);

      const result = await this.cloudinaryInstance.uploader.destroy(publicId);

      if (result.result === 'ok') {
        this.logger.log(`File deleted successfully: ${publicId}`);
      } else {
        this.logger.warn(`File deletion returned status: ${result.result} for ${publicId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file from Cloudinary: ${publicId}`, error);
      // Don't throw error for deletion failures - log and continue
    }
  }

  /**
   * Get file URL from public ID
   * @param publicId - Public ID of the file
   * @returns Secure URL of the file
   */
  getFileUrl(publicId: string): string {
    return this.cloudinaryInstance.url(publicId, { secure: true });
  }
}
