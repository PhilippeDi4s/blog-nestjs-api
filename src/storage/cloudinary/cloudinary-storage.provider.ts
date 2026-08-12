import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { v2 as CloudinaryType } from 'cloudinary';
import { CLOUDINARY } from '../cloudinary/cloudinary.provider';
import {
  ImageStorageProvider,
  UploadImageOptions,
  UploadImageResult,
} from '../image-storage.interface';

@Injectable()
export class CloudinaryStorageProvider implements ImageStorageProvider {
  @Inject(CLOUDINARY) private readonly cloudinary: typeof CloudinaryType;

  async upload(
    buffer: Buffer,
    options: UploadImageOptions,
  ): Promise<UploadImageResult> {
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = this.cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: options.folder,
            public_id: options.publicId,
            context: { uploaded_by: options.uploadedBy },
          },
          (error, result) => {
            if (error || !result) {
              reject(
                new InternalServerErrorException(
                  'Não foi possível enviar a imagem ao servidor',
                ),
              );
              return;
            }
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );

        uploadStream.end(buffer);
      },
    );

    return { url: result.secure_url, id: result.public_id };
  }

  async delete(id: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      void this.cloudinary.uploader.destroy(
        id,
        { resource_type: 'image' },
        (error, result) => {
          if (error || !result) {
            reject(
              new InternalServerErrorException(
                'Não foi possível excluir a imagem do servidor',
              ),
            );
            return;
          }

          resolve();
        },
      );
    });
  }
}
