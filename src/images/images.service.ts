import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Images } from './entities/image.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @InjectRepository(Images)
    private readonly imagesRepository: Repository<Images>,
  ) {}

  async findOneByOrFail(imageUrl: Partial<Images>) {
    const image = await this.imagesRepository.findOneBy(imageUrl);

    if (!image) {
      throw new NotFoundException('Imagem não cadastrada');
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
}
