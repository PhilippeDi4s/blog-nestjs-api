import { Controller, Get, UseGuards } from '@nestjs/common';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ImageResponseDto } from './dto/image-response.dto';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    const images = await this.imagesService.findAll();

    return images.map((image) => new ImageResponseDto(image));
  }
}
