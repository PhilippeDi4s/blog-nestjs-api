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
import { IMAGE_STORAGE_PROVIDER } from './storage/image-storage.interface';
import type { ImageStorageProvider } from './storage/image-storage.interface';

@Injectable()
export class UploadService {
  constructor(
    @Inject(IMAGE_STORAGE_PROVIDER)
    private readonly storageProvider: ImageStorageProvider,
    private readonly imageService: ImagesService,
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

    if (!allowedTypes) {
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
      throw new Error('Falha ao gerar imagem');
    }

    if (
      !outputMetadata.width ||
      !outputMetadata.height ||
      outputMetadata.width > 1920 ||
      outputMetadata.height > 1080
    ) {
      throw new Error('Dimensões inválidas');
    }

    const today = new Date().toISOString().split('T')[0];
    const uniqueSuffix = `${Date.now()}-${generateRandomSuffix()}`;

    const uploadResult = await this.storageProvider.upload(outputBuffer, {
      folder: today,
      publicId: uniqueSuffix,
      uploadedBy: userId,
    });

    const savedImage = await this.imageService.saveImageUrl(
      userId,
      uploadResult.url,
    );

    return savedImage;
  }
}
