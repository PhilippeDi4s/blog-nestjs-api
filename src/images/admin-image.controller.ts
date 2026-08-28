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
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/user/enum/user-role.enum';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { ImageResponseDto } from './dto/image-response.dto';
import { AdminActionReasonDto } from 'src/activity-logs/dto/admin-action-reason.dto';

@Controller('admin/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminImageController {
  constructor(private readonly imageService: ImagesService) {}

  @Get()
  async findAll() {
    const images = await this.imageService.findAll();
    return images.map((image) => new ImageResponseDto(image));
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseUUIDPipe) targetId: string) {
    const restoredImage = await this.imageService.restore(targetId);
    return new ImageResponseDto(restoredImage);
  }

  @Delete(':id')
  async softRemove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: AdminActionReasonDto,
  ) {
    const deletedImage = await this.imageService.removeByAdmin(
      req.user,
      targetId,
      dto.reason,
    );
    return new ImageResponseDto(deletedImage);
  }
}
