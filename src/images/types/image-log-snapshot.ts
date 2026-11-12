import { Images } from '../entities/image.entity';

export interface ImageLogSnapshot {
  url: string;
  folder: string;
  createdAt: Date;
  uploadedById: string | null;
}

export function toImageLogSnapshot(image: Images): ImageLogSnapshot {
  return {
    url: image.url,
    folder: image.folder,
    createdAt: image.createdAt,
    uploadedById: image.uploadedBy?.id ?? null,
  };
}
