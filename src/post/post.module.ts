import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { AdminPostController } from './admin-post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { ImagesModule } from 'src/images/images.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), ImagesModule, ActivityLogsModule],
  controllers: [PostController, AdminPostController],
  providers: [PostService],
})
export class PostModule {}
