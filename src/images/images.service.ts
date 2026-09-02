import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Images } from './entities/image.entity';
import { Repository } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { IMAGE_STORAGE_PROVIDER } from 'src/storage/image-storage.interface';
import type { ImageStorageProvider } from 'src/storage/image-storage.interface';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { UserRole } from 'src/user/enum/user-role.enum';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { ActionType } from 'src/activity-logs/enums/action-type.enum';
import { EntityType } from 'src/activity-logs/enums/entity-type.enum';
import { FiltersImagetDto } from './dto/filters-image.dto';
import { UserService } from 'src/user/user.service';
import { ConfirmAdminActionDto } from 'src/commoun/dto/confirm-admin-action.dto';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @Inject(IMAGE_STORAGE_PROVIDER)
    private readonly storageProvider: ImageStorageProvider,

    @InjectRepository(Images)
    private readonly imagesRepository: Repository<Images>,

    private readonly logService: ActivityLogsService,
    private readonly userService: UserService,
  ) {}

  async findMany(filters: FiltersImagetDto) {
    const {
      id,
      url,
      userId,
      userEmail,
      userName,
      startDate,
      endDate,
      limit = 20,
      page = 1,
    } = filters;

    const query = this.imagesRepository
      .createQueryBuilder('image')
      .leftJoin('image.uploadedBy', 'user')
      .addSelect(['user.id', 'user.name', 'user.email']);

    if (id) query.andWhere('image.id = :id', { id });

    if (url) query.andWhere('image.url = :url', { url });

    if (startDate && endDate) {
      query.andWhere('image.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      query.andWhere('image.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      query.andWhere('image.createdAt <= :endDate', { endDate });
    }

    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    } else {
      if (userName) {
        query.andWhere('unaccent(user.name) ILIKE  unaccent(:userName)', {
          userName: `%${userName}%`,
        });
      }
      if (userEmail) {
        query.andWhere('user.email ILIKE  :userEmail', {
          userEmail: `%${userEmail}%`,
        });
      }
    }

    const [images, count] = await query
      .orderBy('image.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: images,
      total: count,
      page,
      limit,
    };
  }

  async findAllOwned(author: JwtPayload) {
    const images = this.imagesRepository.find({
      where: {
        uploadedBy: { id: author.sub },
      },
      relations: {
        uploadedBy: true,
      },
    });
    return images;
  }

  async findOne(imageData: Partial<Images>) {
    const image = await this.imagesRepository.findOne({
      where: imageData as FindOptionsWhere<Images>,
      relations: { uploadedBy: true },
    });

    return image;
  }

  async findOneOrFail(imageData: Partial<Images>) {
    const image = await this.findOne(imageData);

    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }

    return image;
  }

  async saveImageUrl(
    userId: string,
    publicId: string,
    publicUrl: string,
    folder: string,
  ) {
    const url = this.imagesRepository.create({
      url: publicUrl,
      folder,
      publicId,
      uploadedBy: {
        id: userId,
      },
    });

    const savedUrl = await this.imagesRepository
      .save(url)
      .catch((err: unknown) => {
        if (err instanceof Error) {
          this.logger.error(
            'Erro ao salvar a imagem no Banco de dados',
            err.stack,
          );
        }
        throw new BadRequestException('Erro ao criar o post');
      });

    return savedUrl;
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
    const imageToRestore = await this.imagesRepository.findOne({
      where: { id: targetId },
      withDeleted: true,
      relations: { uploadedBy: true },
    });

    if (!imageToRestore) {
      throw new NotFoundException('Imagem não encontrada');
    }

    if (!imageToRestore.deletedAt) {
      throw new ConflictException('Esta imagem já está ativa');
    }

    const deletedAt = imageToRestore.deletedAt;

    const restoredImage = await this.findOneOrFail({ id: imageToRestore.id });

    await this.imagesRepository.restore(targetId);

    await this.logService.create({
      user: { id: admin.sub } as User,
      action: ActionType.RESTORED,
      entityId: restoredImage.id,
      entityType: EntityType.IMAGE,
      metadata: {
        deletedAt: deletedAt,
      },
      reason: dto.reason,
    });

    return restoredImage;
  }

  async selfRemove(user: JwtPayload, targetId: string) {
    const deletedImage = await this.executeSoftRemove(user, targetId);
    return deletedImage;
  }

  async removeByAdmin(
    admin: JwtPayload,
    targetId: string,
    dto: ConfirmAdminActionDto,
  ) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem realizar essa ação',
      );
    }
    await this.userService.assertPasswordMatchesByUserId(
      admin.sub,
      dto.password,
    );
    const deletedImage = await this.executeSoftRemove(admin, targetId, {
      isAdminAction: true,
      reason: dto.reason,
    });
    return deletedImage;
  }

  private async executeSoftRemove(
    user: JwtPayload,
    targetId: string,
    options: { isAdminAction?: boolean; reason?: string | null } = {},
  ) {
    const imageToDelete = await this.findOneOrFail({ id: targetId });

    const isImageOwner = user.sub === imageToDelete.uploadedBy.id;

    if (!isImageOwner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta imagem',
      );
    }

    const deletedImage = await this.imagesRepository.softRemove(imageToDelete);

    await this.storageProvider.delete(deletedImage.publicId);

    await this.logService.create({
      user: { id: user.sub } as User,
      action: ActionType.DELETED,
      entityId: deletedImage.id,
      entityType: EntityType.IMAGE,
      metadata: {
        selfDelete: !options.isAdminAction,
        targetSnapshot: {
          url: deletedImage.url,
          folder: deletedImage.folder,
          uploadedAt: deletedImage.createdAt,
          uploadedBy: {
            id: deletedImage.uploadedBy.id,
            name: deletedImage.uploadedBy.name,
            email: deletedImage.uploadedBy.email,
          },
        },
      },
      reason: options.reason ?? null,
    });

    return deletedImage;
  }
}
