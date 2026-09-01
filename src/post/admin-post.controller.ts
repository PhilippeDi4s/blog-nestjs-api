import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { PostResponseDto } from './dto/post-response.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { UserRole } from 'src/user/enum/user-role.enum';
import { FiltersPostDto } from './dto/filters-post.dto';
import { UpdatePostAdminDto } from './dto/update-post-admin.dto';
import { ConfirmAdminActionDto } from 'src/commoun/dto/confirm-admin-action.dto';

@Controller('admin/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async findMany(@Query() filters: FiltersPostDto) {
    const posts = await this.postService.findMany(filters);
    return {
      ...posts,
      data: posts.data.map((post) => new PostResponseDto(post)),
    };
  }

  @Patch(':id/update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePostAdminDto,
  ) {
    const updatedPost = await this.postService.updateByAdmin(req.user, id, dto);
    return new PostResponseDto(updatedPost);
  }

  @Patch(':id/restore')
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    const restoredPost = await this.postService.restore(req.user, id, dto);
    return new PostResponseDto(restoredPost);
  }

  @Delete(':id')
  async removeByAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    const post = await this.postService.removeByAdmin(id, req.user, dto);
    return new PostResponseDto(post);
  }
}
