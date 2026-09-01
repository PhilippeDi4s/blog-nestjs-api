import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from './enum/user-role.enum';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { FiltersUserDto } from './dto/filters-user.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ConfirmAdminActionDto } from '../commoun/dto/confirm-admin-action.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findMany(@Query() filters: FiltersUserDto) {
    const users = await this.userService.findMany(filters);
    return {
      ...users,
      data: users.data.map((user) => new UserResponseDto(user)),
    };
  }

  @Patch(':id')
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: UpdateUserAdminDto,
  ) {
    const updatedUser = await this.userService.updateByAdmin(
      req.user,
      targetId,
      dto,
    );
    return new UserResponseDto(updatedUser);
  }

  @Patch(':id/promote')
  async promote(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    const updatedUser = await this.userService.promoteToAdmin(
      req.user,
      dto,
      targetId,
    );
    return new UserResponseDto(updatedUser);
  }

  @Patch(':id/demote')
  async demote(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    const updatedUser = await this.userService.demote(req.user, dto, targetId);
    return new UserResponseDto(updatedUser);
  }

  @Patch(':id/block')
  async block(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    const updatedUser = await this.userService.block(req.user, dto, targetId);
    return new UserResponseDto(updatedUser);
  }

  @Patch(':id/unblock')
  async unblock(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    const updatedUser = await this.userService.unblock(req.user, dto, targetId);
    return new UserResponseDto(updatedUser);
  }

  @Patch(':id/restore')
  async restore(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    const restoredUser = await this.userService.restore(
      req.user,
      targetId,
      dto.reason,
    );
    return new UserResponseDto(restoredUser);
  }

  @Delete(':id')
  async softRemove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    const removedUser = await this.userService.removeByAdmin(
      targetId,
      req.user,
      dto.reason,
    );
    return new UserResponseDto(removedUser);
  }
}
