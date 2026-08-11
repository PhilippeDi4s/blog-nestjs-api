import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(
  PickType(CreatePostDto, [
    'title',
    'coverImage',
    'excerpt',
    'content',
    'published',
  ]),
) {}
