import { FindOptionsWhere, Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from 'src/user/entities/user.entity';
import { createSlugFromText } from 'src/commoun/utils/create-slug-from-text';
import { UpdatePostDto } from './dto/update-post.dto';
import { ImagesService } from 'src/images/images.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { ActionType } from 'src/activity-logs/enums/action-type.enum';
import { EntityType } from 'src/activity-logs/enums/entity-type.enum';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { UserRole } from 'src/user/enum/user-role.enum';
import { FiltersPostDto } from './dto/filters-post.dto';
import { UpdatePostAdminDto } from './dto/update-post-admin.dto';
import { ConfirmAdminActionDto } from 'src/commoun/dto/confirm-admin-action.dto';
import { UserService } from 'src/user/user.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    private readonly imageService: ImagesService,
    private readonly logService: ActivityLogsService,
    private readonly userService: UserService,
  ) {}

  async findOneOrFail(postData: Partial<Post>) {
    const post = await this.findOne(postData);

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    return post;
  }

  async findOne(postData: Partial<Post>) {
    const post = await this.postRepository.findOne({
      where: postData as FindOptionsWhere<Post>,
      relations: { coverImage: { uploadedBy: true }, author: true },
    });

    return post;
  }

  async findAllPublic() {
    const posts = await this.postRepository.find({
      where: { published: true },
      order: {
        createdAt: 'DESC',
      },
      relations: { coverImage: { uploadedBy: true }, author: true },
    });

    return posts;
  }

  async findAll() {
    const posts = await this.postRepository.find({
      order: {
        createdAt: 'DESC',
      },
      relations: { author: true },
    });

    return posts;
  }

  async findOneOwnedOrFail(postData: Partial<Post>, author: JwtPayload) {
    const post = await this.findOneOwned(postData, author.sub);

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    return post;
  }

  async findOneOwned(postData: Partial<Post>, authorId: string) {
    const post = await this.postRepository.findOne({
      where: {
        ...(postData as FindOptionsWhere<Post>),
        author: { id: authorId },
      },
      relations: { coverImage: { uploadedBy: true }, author: true },
    });

    return post;
  }

  async findAllOwned(author: JwtPayload) {
    const posts = await this.postRepository.find({
      where: {
        author: { id: author.sub },
      },
      order: {
        createdAt: 'DESC',
      },
      relations: { coverImage: { uploadedBy: true }, author: true },
    });

    return posts;
  }

  async findMany(filters: FiltersPostDto) {
    const {
      id,
      title,
      slug,
      published,
      authorId,
      authorEmail,
      authorName,
      startDate,
      endDate,
      limit = 20,
      page = 1,
    } = filters;

    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.author', 'user')
      .leftJoin('post.coverImage', 'coverImage')
      .leftJoin('coverImage.uploadedBy', 'uploadedBy')
      .addSelect([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'coverImage.id',
        'coverImage.url',
        'uploadedBy.id',
        'uploadedBy.name',
        'uploadedBy.email',
      ]);

    if (id) query.andWhere('post.id = :id', { id });

    if (title) {
      query.andWhere('unaccent(post.title) ILIKE unaccent(:title)', {
        title: `%${title}%`,
      });
    }

    if (slug) {
      query.andWhere('post.slug ILIKE :slug', { slug: `%${slug}%` });
    }
    if (published !== undefined) {
      query.andWhere('post.published = :published', { published });
    }

    if (startDate && endDate) {
      query.andWhere('post.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      query.andWhere('post.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      query.andWhere('post.createdAt <= :endDate', { endDate });
    }

    if (authorId) {
      query.andWhere('user.id = :authorId', { authorId });
    } else {
      if (authorName) {
        query.andWhere('unaccent(user.name) ILIKE  unaccent(:authorName)', {
          authorName: `%${authorName}%`,
        });
      }
      if (authorEmail) {
        query.andWhere('user.email ILIKE  :authorEmail', {
          authorEmail: `%${authorEmail}%`,
        });
      }
    }

    const [posts, count] = await query
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: posts,
      total: count,
      page,
      limit,
    };
  }

  async create(dto: CreatePostDto, authorToken: JwtPayload) {
    const image = await this.imageService.findOneOrFail({
      url: dto.coverImage,
    });
    const post = this.postRepository.create({
      slug: createSlugFromText(dto.title),
      author: { id: authorToken.sub } as User,
      content: dto.content,
      excerpt: dto.excerpt,
      coverImage: image,
      title: dto.title,
      published: dto.published ?? false,
    });

    const createdPost = await this.postRepository
      .save(post)
      .catch((err: unknown) => {
        if (err instanceof Error) {
          this.logger.error('Erro ao criar post', err.stack);
        }
        throw new BadRequestException('Erro ao criar o post');
      });

    await this.logService.create({
      user: { id: authorToken.sub } as User,
      action: ActionType.CREATED,
      entityId: createdPost.id,
      entityType: EntityType.POST,
      metadata: {
        after: {
          title: createdPost.title,
          exerpt: createdPost.excerpt,
          Ispublished: createdPost.published,
        },
      },
    });

    return createdPost;
  }

  async updateSelf(user: JwtPayload, targetId: string, dto: UpdatePostDto) {
    const updatedPost = await this.executeUpdate(user, targetId, dto);
    return updatedPost;
  }

  async updateByAdmin(
    admin: JwtPayload,
    targetId: string,
    dto: UpdatePostAdminDto,
  ) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem executar esta ação.',
      );
    }
    const { reason, ...dtoWithoutReason } = dto;
    const updatedPost = await this.executeUpdate(
      admin,
      targetId,
      dtoWithoutReason,
      { isAdminAction: true, reason },
    );
    return updatedPost;
  }

  private async executeUpdate(
    user: JwtPayload,
    targetId: string,
    dto: UpdatePostDto,
    options: { isAdminAction?: boolean; reason?: string | null } = {},
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Dados não enviados');
    }

    const post = await this.findOneOrFail({ id: targetId });

    const isPostOwned = post.author?.id === user.sub;

    if (!isPostOwned && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esse post',
      );
    }

    const before: Partial<Post> = {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      published: post.published,
    };

    post.title = dto.title ?? post.title;
    post.content = dto.content ?? post.content;
    post.excerpt = dto.excerpt ?? post.excerpt;
    post.published = dto.published ?? post.published;

    if (dto.coverImage) {
      const image = await this.imageService.findOneOrFail({
        url: dto.coverImage,
      });

      post.coverImage = image;
    }

    const updatedPost = await this.postRepository.save(post);

    const after: Partial<Post> = {
      title: updatedPost.title,
      content: updatedPost.content,
      excerpt: updatedPost.excerpt,
      published: updatedPost.published,
    };

    await this.logService.create({
      user: { id: user.sub } as User,
      action: ActionType.UPDATED,
      entityId: updatedPost.id,
      entityType: EntityType.POST,
      reason: options.reason ?? null,
      metadata: {
        selfUpdate: !options.isAdminAction,
        before,
        after,
      },
    });

    return updatedPost;
  }

  async restore(
    admin: JwtPayload,
    targetId: string,
    dto: ConfirmAdminActionDto,
  ) {
    await this.userService.assertPasswordMatchesByUserId(
      admin.sub,
      dto.password,
    );
    const postToRestore = await this.postRepository.findOne({
      where: { id: targetId },
      withDeleted: true,
      relations: { author: true },
    });

    if (!postToRestore) {
      throw new NotFoundException('Post não encontrado');
    }

    if (!postToRestore.deletedAt) {
      throw new ConflictException('Este post já está ativo');
    }

    const deletedAt = postToRestore.deletedAt;

    await this.postRepository.restore(postToRestore.id);

    const retoredPost = await this.findOneOrFail({ id: postToRestore.id });

    await this.logService.create({
      user: { id: admin.sub } as User,
      action: ActionType.RESTORED,
      entityId: retoredPost.id,
      entityType: EntityType.POST,
      metadata: {
        deletedAt: deletedAt,
      },
      reason: dto.reason,
    });

    return retoredPost;
  }

  async removeSelf(targetId: string, user: JwtPayload) {
    return this.executeSoftRemove(targetId, user);
  }

  async removeByAdmin(
    targetId: string,
    admin: JwtPayload,
    dto: ConfirmAdminActionDto,
  ) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem executar esta ação.',
      );
    }
    await this.userService.assertPasswordMatchesByUserId(
      admin.sub,
      dto.password,
    );
    return this.executeSoftRemove(targetId, admin, {
      isAdminAction: true,
      reason: dto.reason,
    });
  }

  private async executeSoftRemove(
    targetId: string,
    user: JwtPayload,
    options: { isAdminAction?: boolean; reason?: string | null } = {},
  ) {
    const postToDelete = await this.findOneOrFail({ id: targetId });

    const isOwnPost = postToDelete.author.id === user.sub;

    if (!isOwnPost && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esse post',
      );
    }

    const removedPost = await this.postRepository.softRemove(postToDelete);

    await this.logService.create({
      user: { id: user.sub } as User,
      action: ActionType.DELETED,
      entityId: removedPost.id,
      entityType: EntityType.POST,
      metadata: {
        selfDelete: !options.isAdminAction,
        targetSnapshot: {
          title: removedPost.title,
          wasPublished: removedPost.published,
          author: removedPost.author.name,
          email: removedPost.author.email,
        },
      },
      reason: options.reason ?? null,
    });

    return removedPost;
  }
}
