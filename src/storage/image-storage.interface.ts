export interface UploadImageOptions {
  folder: string;
  publicId: string;
  uploadedBy: string;
}

export interface UploadImageResult {
  url: string;
  id: string;
}

export interface ImageStorageProvider {
  upload(
    buffer: Buffer,
    options: UploadImageOptions,
  ): Promise<UploadImageResult>;
  delete(id: string): Promise<void>;
}

export const IMAGE_STORAGE_PROVIDER = Symbol('IMAGE_STORAGE_PROVIDER');
