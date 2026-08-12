import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ImageResponseDto } from './dto/image-response.dto';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    const images = await this.imagesService.findAll();

    return images.map((image) => new ImageResponseDto(image));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findAllOwned(@Req() req: AuthenticatedRequest) {
    const images = await this.imagesService.findAllOwned(req.user);

    return images.map((image) => new ImageResponseDto(image));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) image_id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const image = await this.imagesService.remove(req.user, { image_id });

    return new ImageResponseDto(image);
  }
}
