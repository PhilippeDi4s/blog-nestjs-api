import { forwardRef, Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { AdminImageController } from './admin-image.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Images } from './entities/image.entity';
import { StorageModule } from 'src/storage/storage.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';
import { UserModule } from 'src/user/user.module';
import { PostModule } from 'src/post/post.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Images]),
    StorageModule,
    ActivityLogsModule,
    UserModule,
    forwardRef(() => PostModule),
  ],
  controllers: [ImagesController, AdminImageController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
