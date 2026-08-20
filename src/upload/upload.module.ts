import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ImagesModule } from 'src/images/images.module';
import { StorageModule } from 'src/storage/storage.module';
import { CloudinaryProvider } from 'src/storage/cloudinary/cloudinary.provider';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  imports: [ImagesModule, StorageModule, ActivityLogsModule],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryProvider],
  exports: [CloudinaryProvider],
})
export class UploadModule {}
