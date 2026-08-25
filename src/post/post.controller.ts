import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/user/enum/user-role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(JwtAuthGuard)
  @Post('me')
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePostDto) {
    const post = await this.postService.create(dto, req.user);
    return new PostResponseDto(post);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/:id')
  async findOneOwned(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const post = await this.postService.findOneOwnedOrFail({ id }, req.user);
    return new PostResponseDto(post);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findAllOwned(@Req() req: AuthenticatedRequest) {
    const posts = await this.postService.findAllOwned(req.user);
    return posts.map((post) => new PostResponseDto(post));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePostDto,
  ) {
    const updatedPost = await this.postService.update({ id }, dto, req.user);
    return new PostResponseDto(updatedPost);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/:id')
  async removeSelf(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const post = await this.postService.removeSelf(id, req.user);
    return new PostResponseDto(post);
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

  @Get(':slug')
  async findOnePublished(@Param('slug') slug: string) {
    const post = await this.postService.findOneOrFail({
      slug,
      published: true,
    });
    return new PostResponseDto(post);
  }

  @Get()
  async findAllPublished() {
    const posts = await this.postService.findAll({ published: true });
    return posts.map((post) => new PostResponseDto(post));
  }
}
