import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { HashingService } from 'src/commoun/hashing/hashing.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { ActionType } from 'src/activity-logs/enums/action-type.enum';
import { EntityType } from 'src/activity-logs/enums/entity-type.enum';
import { UserRole } from './enum/user-role.enum';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly logService: ActivityLogsService,
  ) {}

  async failIfEmailExists(email: string) {
    const exists = await this.userRepository.existsBy({
      email,
    });

    if (exists) {
      throw new ConflictException('E-mail já cadastrado');
    }
  }

  async findOneByOrFail(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    await this.failIfEmailExists(dto.email);

    const hashedPassword = await this.hashingService.hash(dto.password);

    const created = await this.userRepository.save({
      name: dto.name,
      email: dto.email,
      passwordHash: hashedPassword,
    });

    await this.logService.create({
      user: created,
      action: ActionType.CREATED,
      entityId: created.id,
      entityType: EntityType.USER,
      metadata: { after: { name: created.name } },
    });

    return created;
  }

  findByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  findById(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  async update(id: string, dto: UpdateUserDto) {
    if (!dto.name && !dto.email) {
      throw new BadRequestException('Dados não enviados');
    }

    const user = await this.findOneByOrFail(id);

    const before = { name: user.name, email: user.email };

    user.name = dto.name ?? user.name;

    if (dto.email && dto.email !== user.email) {
      await this.failIfEmailExists(dto.email);

      user.email = dto.email;
      user.forceLogout = true;
    }

    const updatedUser = await this.save(user);

    const after = { name: updatedUser.name, email: updatedUser.email };

    await this.logService.create({
      user: updatedUser,
      action: ActionType.UPDATED,
      entityId: user.id,
      entityType: EntityType.USER,
      metadata: {
        before,
        after,
      },
    });

    return updatedUser;
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const user = await this.findOneByOrFail(id);

    const isCurrentPasswordValid = await this.hashingService.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual inválida');
    }

    const isNewPasswordEqual = await this.hashingService.compare(
      dto.newPassword,
      user.passwordHash,
    );

    if (isNewPasswordEqual) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual.',
      );
    }

    user.passwordHash = await this.hashingService.hash(dto.newPassword);
    user.forceLogout = true;

    const updatedUser = await this.save(user);

    await this.logService.create({
      user: updatedUser,
      action: ActionType.PASSWORD_CHANGE,
      entityId: updatedUser.id,
      entityType: EntityType.USER,
      metadata: {},
    });

    return updatedUser;
  }

  async removeSelf(user: JwtPayload) {
    return this.executeSoftRemove(user.sub, user);
  }

  async removeByAdmin(targetId: string, admin: JwtPayload) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem executar esta ação.',
      );
    }
    return this.executeSoftRemove(targetId, admin, { isAdminAction: true });
  }

  private async executeSoftRemove(
    targetId: string,
    requestingUser: JwtPayload,
    options: { isAdminAction?: boolean } = {},
  ) {
    const userToDelete = await this.findOneByOrFail(targetId);

    if (userToDelete.role === UserRole.ADMIN) {
      const adminCount = await this.userRepository.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Não é possível excluir o único administrador do sistema',
        );
      }
    }

    const removedUser = await this.userRepository.softRemove(userToDelete);

    await this.logService.create({
      user: { id: requestingUser.sub } as User,
      action: ActionType.DELETED,
      entityId: targetId,
      entityType: EntityType.USER,
      metadata: {
        selfDelete: !options.isAdminAction,
        targetSnapshot: {
          name: removedUser.name,
          email: removedUser.email,
          role: removedUser.role,
        },
      },
    });

    return removedUser;
  }

  save(user: User) {
    return this.userRepository.save(user);
  }
}
