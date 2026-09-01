import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { generateRandomSuffix } from 'src/commoun/utils/generate-random-suffix';
import { ImagesService } from 'src/images/images.service';
import { IMAGE_STORAGE_PROVIDER } from '../storage/image-storage.interface';
import type { ImageStorageProvider } from '../storage/image-storage.interface';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { User } from 'src/user/entities/user.entity';
import { ActionType } from 'src/activity-logs/enums/action-type.enum';
import { EntityType } from 'src/activity-logs/enums/entity-type.enum';
import { UserService } from 'src/user/user.service';
import { slugify } from 'src/commoun/utils/slugify';

@Injectable()
export class UploadService {
  constructor(
    @Inject(IMAGE_STORAGE_PROVIDER)
    private readonly storageProvider: ImageStorageProvider,
    private readonly imageService: ImagesService,
    private readonly logService: ActivityLogsService,
    private readonly userService: UserService,
  ) {}

  async handleUpload(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const maxFileSize = Number(process.env.IMAGE_MAX_UPLOAD_SIZE || 921600);

    if (file.size > maxFileSize) {
      throw new BadRequestException('Arquivo muito grande');
    }

    const fileBuffer = file.buffer;

    const fileType = await fileTypeFromBuffer(fileBuffer);

    const allowedTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') ?? [];

    if (allowedTypes.length === 0) {
      throw new InternalServerErrorException(
        'ALLOWED_IMAGE_TYPES não foi configurada.',
      );
    }

    if (!fileType || !allowedTypes.includes(fileType.mime)) {
      throw new BadRequestException('Arquivo inválido ou tipo não permitido.');
    }

    const outputBuffer = await sharp(fileBuffer, {
      limitInputPixels: Number(process.env.MAX_INPUT_PIXELS || 25_000_000),
      failOn: 'warning',
    })
      .rotate()
      .resize({
        width: 1920,
        height: 1080,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
      })
      .toBuffer();

    const outputMetadata = await sharp(outputBuffer).metadata();

    if (outputMetadata.format !== 'webp') {
      throw new InternalServerErrorException('Falha ao gerar imagem');
    }

    if (
      !outputMetadata.width ||
      !outputMetadata.height ||
      outputMetadata.width > 1920 ||
      outputMetadata.height > 1080
    ) {
      throw new InternalServerErrorException('Dimensões inválidas');
    }

    const today = new Date().toISOString().split('T')[0];
    const user = await this.userService.findOneByOrFail(userId);
    const authorSlug = slugify(user.name);
    const uniqueSuffix = `${Date.now()}-${generateRandomSuffix()}`;
    const folder = `${today}/${authorSlug}-${user.id}`;

    const uploadResult = await this.storageProvider.upload(outputBuffer, {
      folder,
      publicId: uniqueSuffix,
      uploadedBy: userId,
    });

    const savedImage = await this.imageService.saveImageUrl(
      userId,
      uniqueSuffix,
      uploadResult.url,
      folder,
    );

    await this.logService.create({
      user: { id: userId } as User,
      action: ActionType.CREATED,
      entityId: savedImage.id,
      entityType: EntityType.IMAGE,
      metadata: {
        after: {
          url: savedImage.url,
          folder,
        },
      },
    });

    return savedImage;
  }
}
