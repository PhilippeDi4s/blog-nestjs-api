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

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @Inject(IMAGE_STORAGE_PROVIDER)
    private readonly storageProvider: ImageStorageProvider,

    @InjectRepository(Images)
    private readonly imagesRepository: Repository<Images>,

    private readonly logService: ActivityLogsService,
  ) {}

  async findAll() {
    const images = await this.imagesRepository.find({
      relations: {
        uploaded_by: true,
      },
    });

    return images;
  }

  async findAllOwned(author: Partial<User>) {
    const images = this.imagesRepository.find({
      where: {
        uploaded_by: { id: author.id },
      },
      relations: {
        uploaded_by: true,
      },
    });
    return images;
  }

  async findOne(imageData: Partial<Images>) {
    const image = await this.imagesRepository.findOne({
      where: imageData as FindOptionsWhere<Images>,
      relations: { uploaded_by: true },
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
      uploaded_by: {
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

  async restore(targetId: string) {
    const imageToRestore = await this.imagesRepository.findOne({
      where: { image_id: targetId },
      withDeleted: true,
      relations: { uploaded_by: true },
    });

    if (!imageToRestore) {
      throw new NotFoundException('Imagem não encontrada');
    }

    if (!imageToRestore.deletedAt) {
      throw new ConflictException('Esta imagem já está ativa');
    }

    await this.imagesRepository.restore(targetId);

    return this.findOneOrFail({ image_id: targetId });
  }

  async selfRemove(user: JwtPayload, targetId: string) {
    const deletedImage = await this.executeSoftRemove(user, targetId);
    return deletedImage;
  }

  async removeByAdmin(admin: JwtPayload, targetId: string) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem realizar essa ação',
      );
    }
    const deletedImage = await this.executeSoftRemove(admin, targetId, {
      isAdminAction: true,
    });
    return deletedImage;
  }

  private async executeSoftRemove(
    user: JwtPayload,
    targetId: string,
    options: { isAdminAction?: boolean } = {},
  ) {
    const imageToDelete = await this.findOneOrFail({ image_id: targetId });

    const isImageOwner = user.sub === imageToDelete.uploaded_by.id;

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
      entityId: deletedImage.image_id,
      entityType: EntityType.IMAGE,
      metadata: {
        selfDelete: !options.isAdminAction,
        targetSnapshot: {
          url: deletedImage.url,
          folder: deletedImage.folder,
          uploadedAt: deletedImage.created_at,
          uploadedBy: {
            id: deletedImage.uploaded_by.id,
            name: deletedImage.uploaded_by.name,
            email: deletedImage.uploaded_by.email,
          },
        },
      },
    });

    return deletedImage;
  }
}
