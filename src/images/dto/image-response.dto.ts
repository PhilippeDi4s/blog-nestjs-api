import { Images } from '../entities/image.entity';

export class ImageResponseDto {
  readonly id: string;
  readonly url: string;
  readonly createdAt: Date;
  readonly uploadedBy: {
    id: string;
    name: string;
    email: string;
  };

  constructor(images: Images) {
    this.id = images.id;
    this.url = images.url;
    this.createdAt = images.createdAt;
    this.uploadedBy = {
      id: images.uploadedBy.id,
      name: images.uploadedBy.name,
      email: images.uploadedBy.email,
    };
  }
}
