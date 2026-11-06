import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ImageResponseDto } from './dto/image-response.dto';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { PaginationDto } from 'src/commoun/dto/pagination.dto';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findAllOwned(
    @Req() req: AuthenticatedRequest,
    @Query() filters: PaginationDto,
  ) {
    const images = await this.imagesService.findAllOwned(req.user, filters);
    return {
      ...images,
      data: images.data.map((image) => new ImageResponseDto(image)),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const image = await this.imagesService.findOneOrFail({ id });

    return new ImageResponseDto(image);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const image = await this.imagesService.selfRemove(req.user, targetId);
    return new ImageResponseDto(image);
  }
}
