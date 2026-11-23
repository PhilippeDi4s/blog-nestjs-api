import { User } from '../entities/user.entity';
import { UserResponseDto } from './user-response.dto';

export class UserProfileResponseDto extends UserResponseDto {
  readonly publishedPostsCount: number;

  constructor(user: User, publishedPostsCount: number) {
    super(user);
    this.publishedPostsCount = publishedPostsCount;
  }
}
