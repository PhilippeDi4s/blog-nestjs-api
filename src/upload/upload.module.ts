import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ImagesModule } from 'src/images/images.module';
import { CloudinaryProvider } from './cloudinary/cloudinary.provider';

@Module({
  imports: [ImagesModule],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryProvider],
  exports: [CloudinaryProvider],
})
export class UploadModule {}
