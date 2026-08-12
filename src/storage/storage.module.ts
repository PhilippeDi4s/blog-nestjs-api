import { Module } from '@nestjs/common';
import { IMAGE_STORAGE_PROVIDER } from 'src/storage/image-storage.interface';
import { CloudinaryStorageProvider } from './cloudinary/cloudinary-storage.provider';
import { CloudinaryProvider } from './cloudinary/cloudinary.provider';

@Module({
  providers: [
    CloudinaryProvider,
    {
      provide: IMAGE_STORAGE_PROVIDER,
      useClass: CloudinaryStorageProvider,
    },
  ],
  exports: [IMAGE_STORAGE_PROVIDER],
})
export class StorageModule {}
