import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from 'src/commoun/hashing/hashing.service';
import { JwtPayload } from './types/jwt-payload.type';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { EntityType } from 'src/activity-logs/enums/entity-type.enum';
import { ActionType } from 'src/activity-logs/enums/action-type.enum';
import { User } from 'src/user/entities/user.entity';
import { UserRole } from 'src/user/enum/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly logService: ActivityLogsService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);

    const error = new UnauthorizedException('Usuário ou senha inválidos');

    if (!user) {
      throw error;
    }

    const isPasswordValid = await this.hashingService.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw error;
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Usuário bloqueado.');
    }

    const JwtPayload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(JwtPayload);

    user.forceLogout = false;

    await this.userService.save(user);

    await this.logService.create({
      user,
      entityId: user.id,
      entityType: EntityType.USER,
      action: ActionType.LOGIN,
      metadata: {},
    });

    return { accessToken };
  }

  async logout(user: JwtPayload) {
    return this.executeLogout(user, user.sub);
  }

  async forceLogout(admin: JwtPayload, userId: string) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para realizar essa ação',
      );
    }

    return this.executeLogout(admin, userId, { isAdminAction: true });
  }

  private async executeLogout(
    user: JwtPayload,
    targetId: string,
    option: { isAdminAction?: boolean } = {},
  ) {
    const userToLogOut = await this.userService.findOneByOrFail(targetId);

    userToLogOut.forceLogout = true;

    const userLoggedOut = await this.userService.save(userToLogOut);

    await this.logService.create({
      user: { id: user.sub } as User,
      entityId: userLoggedOut.id,
      entityType: EntityType.USER,
      action: ActionType.LOGOUT,
      metadata: {
        selfLogOut: !option.isAdminAction,
      },
    });
  }
}
