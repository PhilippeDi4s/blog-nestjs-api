import { Images } from '../entities/image.entity';

export class ImageResponseDto {
  readonly image_id: string;
  readonly url: string;
  readonly created_at: Date;
  readonly uploaded_by: {
    id: string;
    name: string;
    email: string;
  };

  constructor(images: Images) {
    this.image_id = images.image_id;
    this.url = images.url;
    this.created_at = images.created_at;
    this.uploaded_by = {
      id: images.uploaded_by.id,
      name: images.uploaded_by.name,
      email: images.uploaded_by.email,
    };
  }
}
