import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Images } from './entities/image.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { IMAGE_STORAGE_PROVIDER } from 'src/storage/image-storage.interface';
import type { ImageStorageProvider } from 'src/storage/image-storage.interface';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @Inject(IMAGE_STORAGE_PROVIDER)
    private readonly storageProvider: ImageStorageProvider,

    @InjectRepository(Images)
    private readonly imagesRepository: Repository<Images>,
  ) {}

  async findAll() {
    const images = await this.imagesRepository.find({
      relations: {
        uploaded_by: true,
      },
    });

    if (!images) {
      throw new NotFoundException('Nenhuma imagem encontrada');
    }

    return images;
  }

  async findAllOwned(author: User) {
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
      where: imageData,
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

  async saveImageUrl(userId: string, publicUrl: string) {
    const url = this.imagesRepository.create({
      url: publicUrl,
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

  async remove(author: User, imageData: Partial<Images>) {
    const image = await this.findOneOrFail(imageData);

    if (image.uploaded_by.id !== author.id) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta imagem',
      );
    }

    await this.imagesRepository.delete({
      image_id: image.image_id,
      uploaded_by: { id: author.id },
    });

    await this.storageProvider.delete(image.image_id);

    return image;
  }
}
