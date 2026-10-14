import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './types/authenticated-request';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from 'src/user/enum/user-role.enum';
import { ConfirmAdminActionDto } from 'src/commoun/dto/confirm-admin-action.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getAuthenticatedUser(@Req() req: AuthenticatedRequest) {
    const user = await this.authService.getAuthenticatedUser(req.user);
    return new UserResponseDto(user);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { accessToken } = await this.authService.login(loginDto);
    return {
      accessToken,
      expiresIn: Number(process.env.JWT_EXPIRES_IN_SEC),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logOut(@Req() req: AuthenticatedRequest) {
    await this.authService.logout(req.user);
    return {
      message: 'Logout realizado com sucesso',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admin/:id/logout')
  async logoutByAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('id') targetId: string,
    @Body() dto: ConfirmAdminActionDto,
  ) {
    await this.authService.forceLogout(req.user, targetId, dto);

    return {
      message: 'Logout realizado com sucesso',
    };
  }
}
