import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdminUserController } from './admin-user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CommonModule } from 'src/commoun/common.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CommonModule, ActivityLogsModule],
  providers: [UserService],
  controllers: [UserController, AdminUserController],
  exports: [UserService],
})
export class UserModule {}
