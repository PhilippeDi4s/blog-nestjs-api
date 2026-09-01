import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
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
import { ConfirmAdminActionDto } from 'src/commoun/dto/confirm-admin-action.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(ActivityLogsService.name);
  constructor(
    private readonly userService: UserService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly logService: ActivityLogsService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email, {
      includePassword: true,
    });

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

  async forceLogout(
    admin: JwtPayload,
    userId: string,
    dto: ConfirmAdminActionDto,
  ) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para realizar essa ação',
      );
    }

    await this.userService.assertPasswordMatchesByUserId(
      admin.sub,
      dto.password,
    );

    return this.executeLogout(admin, userId, {
      isAdminAction: true,
      reason: dto.reason,
    });
  }

  private async executeLogout(
    user: JwtPayload,
    targetId: string,
    options: { isAdminAction?: boolean; reason?: string | null } = {},
  ) {
    const userToLogOut = await this.userService.findOneByOrFail(targetId);

    if (userToLogOut.forceLogout === true) {
      throw new ConflictException('Usuário já está com acesso bloqueado');
    }

    userToLogOut.forceLogout = true;

    const userLoggedOut = await this.userService.save(userToLogOut);

    await this.logService.create({
      user: { id: user.sub } as User,
      entityId: userLoggedOut.id,
      entityType: EntityType.USER,
      action: ActionType.LOGOUT,
      reason: options.reason ?? null,
      metadata: {
        selfLogOut: !options.isAdminAction,
      },
    });
  }

  async revokeForceLogout(
    admin: JwtPayload,
    targetId: string,
    dto: ConfirmAdminActionDto,
  ) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para realizar essa ação',
      );
    }
    await this.userService.assertPasswordMatchesByUserId(
      admin.sub,
      dto.password,
    );
    const user = await this.userService.findOneByOrFail(targetId);

    if (user.forceLogout === false) {
      throw new ConflictException('Usuário já está com acesso liberado');
    }

    user.forceLogout = false;

    await this.userService.save(user);

    await this.logService.create({
      user: { id: admin.sub } as User,
      entityId: user.id,
      entityType: EntityType.USER,
      action: ActionType.REVOKE_FORCE_LOGOUT,
      reason: dto.reason,
      metadata: {},
    });
  }
}
