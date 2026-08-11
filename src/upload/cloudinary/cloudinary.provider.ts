// cloudinary/cloudinary.provider.ts
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  useFactory: (configService: ConfigService) => {
    cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
    return cloudinary;
  },
  inject: [ConfigService],
};
