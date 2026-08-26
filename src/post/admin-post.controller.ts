import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { PostResponseDto } from './dto/post-response.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { UserRole } from 'src/user/enum/user-role.enum';

@Controller('admin/posts')
export class AdminPostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll() {
    const posts = await this.postService.findAll();
    return posts.map((post) => {
      new PostResponseDto(post);
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/restore')
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const restoredPost = await this.postService.restore(id);
    return new PostResponseDto(restoredPost);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async removeByAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const post = await this.postService.removeByAdmin(id, req.user);
    return new PostResponseDto(post);
  }
}
