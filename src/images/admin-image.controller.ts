import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/user/enum/user-role.enum';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { ImageResponseDto } from './dto/image-response.dto';
import { FiltersImagetDto } from './dto/filters-image.dto';
import { ConfirmAdminActionDto } from 'src/commoun/dto/confirm-admin-action.dto';

@Controller('admin/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminImageController {
  constructor(private readonly imageService: ImagesService) {}

  @Get()
  async findMany(@Query() filters: FiltersImagetDto) {
    const images = await this.imageService.findMany(filters);
    return {
      ...images,
      data: images.data.map((image) => new ImageResponseDto(image)),
    };
  }

  @Patch(':id/restore')
  async restore(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    const restoredImage = await this.imageService.restore(
      req.user,
      targetId,
      dto,
    );
    return new ImageResponseDto(restoredImage);
  }

  @Delete(':id')
  async softRemove(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    const deletedImage = await this.imageService.removeByAdmin(
      req.user,
      targetId,
      dto,
    );
    return new ImageResponseDto(deletedImage);
  }
}
