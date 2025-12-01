import { BadRequestException } from '@nestjs/common';

// Allowed file types for document uploads
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

// Maximum file size: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file type
 */
export function validateFileType(mimetype: string): FileValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: PDF, JPEG, JPG, PNG`,
    };
  }
  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): FileValidationResult {
  if (size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }
  return { valid: true };
}

/**
 * Validate file (type and size)
 */
export function validateFile(file: Express.Multer.File): void {
  // Validate file type
  const typeValidation = validateFileType(file.mimetype);
  if (!typeValidation.valid) {
    throw new BadRequestException(typeValidation.error);
  }

  // Validate file size
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.valid) {
    throw new BadRequestException(sizeValidation.error);
  }
}

/**
 * Get file extension from mimetype
 */
export function getFileExtension(mimetype: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
  };
  return extensions[mimetype] || 'bin';
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
