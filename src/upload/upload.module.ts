import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ImagesModule } from 'src/images/images.module';
import { CloudinaryProvider } from './cloudinary/cloudinary.provider';
import { IMAGE_STORAGE_PROVIDER } from './storage/image-storage.interface';
import { CloudinaryStorageProvider } from './cloudinary/cloudinary-storage.provider';

@Module({
  imports: [ImagesModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    CloudinaryProvider,
    {
      provide: IMAGE_STORAGE_PROVIDER,
      useClass: CloudinaryStorageProvider,
    },
  ],
  exports: [CloudinaryProvider],
})
export class UploadModule {}
