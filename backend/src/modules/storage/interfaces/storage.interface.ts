export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
  folder: string;
}

export interface IStorageService {
  /**
   * Upload a file to storage
   * @param file - File buffer from multer
   * @param folder - Optional subfolder path
   * @returns Upload result with URL and metadata
   */
  uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult>;

  /**
   * Delete a file from storage
   * @param publicId - Unique identifier of the file
   */
  deleteFile(publicId: string): Promise<void>;

  /**
   * Get the URL of a stored file
   * @param publicId - Unique identifier of the file
   * @returns Secure URL to access the file
   */
  getFileUrl(publicId: string): string;
}
