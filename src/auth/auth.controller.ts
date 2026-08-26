import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  Res,
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.login(loginDto);

    res.cookie(`${process.env.COOKIE_NAME}`, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: Number(process.env.JWT_EXPIRES_IN_MS),
    });
    return {
      message: 'Login realizado com sucesso',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logOut(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user);

    res.clearCookie(process.env.COOKIE_NAME!, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admin/logout/:id')
  async logoutByAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('id') targetId: string,
  ) {
    await this.authService.forceLogout(req.user, targetId);

    return {
      message: 'Logout realizado com sucesso',
    };
  }
}
