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
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { HashingService } from 'src/commoun/hashing/hashing.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { ActionType } from 'src/activity-logs/enums/action-type.enum';
import { EntityType } from 'src/activity-logs/enums/entity-type.enum';
import { UserRole } from './enum/user-role.enum';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { FiltersUserDto } from './dto/filters-user.dto';
import { ConfirmPasswordDto } from './dto/confirm-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly logService: ActivityLogsService,
  ) {}

  private async assertPasswordMatches(
    plainPassword: string,
    passwordHash: string,
  ): Promise<void> {
    const isValid = await this.hashingService.compare(
      plainPassword,
      passwordHash,
    );

    if (!isValid) {
      throw new UnauthorizedException('Senha incorreta!');
    }
  }

  private async assertNotLastAdmin(): Promise<void> {
    const adminCount = await this.userRepository.count({
      where: { role: UserRole.ADMIN },
    });

    if (adminCount <= 1) {
      throw new ConflictException(
        'Não é possível remover o último administrador do sistema.',
      );
    }
  }

  async failIfEmailExists(email: string) {
    const exists = await this.userRepository.existsBy({
      email,
    });

    if (exists) {
      throw new ConflictException('E-mail já cadastrado');
    }
  }

  async findOneByOrFail(
    id: string,
    options: { includePassword?: boolean } = {},
  ) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id });

    if (options.includePassword) {
      query.addSelect('user.passwordHash');
    }

    const user = await query.getOne();

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

  async createWithRole(userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    const { name, email, password, role } = userData;

    const passwordHash = await this.hashingService.hash(password);

    const user = this.userRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        name,
        email,
        passwordHash,
        role,
      })
      .execute();

    return user;
  }

  findByEmail(email: string, options: { includePassword?: boolean } = {}) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (options.includePassword) {
      query.addSelect('user.passwordHash');
    }

    const user = query.getOne();

    return user;
  }

  findById(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  async findMany(filters: FiltersUserDto) {
    const {
      id,
      name,
      email,
      isBlocked,
      forceLogout,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const where: FindOptionsWhere<User> = {};

    if (id) {
      where.id = id;
    } else {
      if (name) {
        where.name = ILike(name);
      }

      if (email) {
        where.email = ILike(email);
      }

      if (forceLogout !== undefined) {
        where.forceLogout = forceLogout;
      }

      if (isBlocked !== undefined) {
        where.isBlocked = isBlocked;
      }

      if (startDate && endDate) {
        where.createdAt = Between(startDate, endDate);
      } else if (startDate) {
        where.createdAt = MoreThanOrEqual(startDate);
      } else if (endDate) {
        where.createdAt = LessThanOrEqual(endDate);
      }
    }

    const [logs, total] = await this.userRepository.findAndCount({
      where,
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      total,
      page,
      limit,
    };
  }

  async updateSelf(user: JwtPayload, dto: UpdateUserDto) {
    const updatedUser = await this.executeUpdate(user.sub, user, dto);
    return updatedUser;
  }

  async updateByAdmin(admin: JwtPayload, targetId: string, dto: UpdateUserDto) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este usuário',
      );
    }
    const updatedUser = await this.executeUpdate(targetId, admin, dto, {
      isAdminAction: true,
    });
    return updatedUser;
  }

  private async executeUpdate(
    targetId: string,
    requestingUser: JwtPayload,
    dto: UpdateUserDto,
    options: { isAdminAction?: boolean; reason?: string | null } = {},
  ) {
    const userToUpdate = await this.findOneByOrFail(targetId);

    if (!dto.name && !dto.email) {
      throw new BadRequestException('Dados não enviados');
    }

    const isSelfUpdate = requestingUser.sub === userToUpdate.id;

    if (!isSelfUpdate && requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este usuário',
      );
    }

    const before = { name: userToUpdate.name, email: userToUpdate.email };

    userToUpdate.name = dto.name ?? userToUpdate.name;

    if (dto.email && dto.email !== userToUpdate.email) {
      await this.failIfEmailExists(dto.email);

      userToUpdate.email = dto.email;
      userToUpdate.forceLogout = true;
    }

    const updatedUser = await this.save(userToUpdate);

    const after = { name: updatedUser.name, email: updatedUser.email };

    await this.logService.create({
      user: { id: requestingUser.sub } as User,
      action: ActionType.UPDATED,
      entityId: updatedUser.id,
      entityType: EntityType.USER,
      metadata: {
        selfUpdate: !options.isAdminAction,
        before,
        after,
      },
      reason: options.reason ?? null,
    });

    return updatedUser;
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const user = await this.findOneByOrFail(id, { includePassword: true });

    await this.assertPasswordMatches(dto.currentPassword, user.passwordHash);

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

  async promoteToAdmin(
    adminToken: JwtPayload,
    dto: ConfirmPasswordDto,
    targetId: string,
  ) {
    if (adminToken.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem executar esta ação.',
      );
    }
    const admin = await this.findOneByOrFail(adminToken.sub, {
      includePassword: true,
    });

    await this.assertPasswordMatches(dto.password, admin.passwordHash);

    const user = await this.findOneByOrFail(targetId);
    if (user.role === UserRole.ADMIN) {
      throw new ConflictException('Usuário já é administrador.');
    }

    const formerRole = user.role;
    user.role = UserRole.ADMIN;
    await this.userRepository.save(user);

    await this.logService.create({
      user: admin,
      action: ActionType.PROMOTE,
      entityId: user.id,
      entityType: EntityType.USER,
      metadata: {
        previousRole: formerRole,
        newRole: user.role,
        targetEmail: user.email,
        performedByEmail: admin.email,
      },
    });

    return user;
  }

  async demote(
    adminToken: JwtPayload,
    dto: ConfirmPasswordDto,
    targetId: string,
  ) {
    if (adminToken.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem executar esta ação.',
      );
    }

    if (adminToken.sub === targetId) {
      throw new ForbiddenException(
        'Você não pode remover seu próprio acesso de administrador.',
      );
    }

    const admin = await this.findOneByOrFail(adminToken.sub, {
      includePassword: true,
    });
    await this.assertPasswordMatches(dto.password, admin.passwordHash);

    const user = await this.findOneByOrFail(targetId);

    if (user.role === UserRole.USER) {
      throw new ConflictException('Usuário já possui esse cargo atualmente.');
    }

    await this.assertNotLastAdmin();

    const formerRole = user.role;
    user.role = UserRole.USER;
    await this.userRepository.save(user);

    await this.logService.create({
      user: admin,
      action: ActionType.DEMOTE,
      entityId: user.id,
      entityType: EntityType.USER,
      metadata: {
        previousRole: formerRole,
        newRole: user.role,
        targetEmail: user.email,
        performedByEmail: admin.email,
      },
    });

    return user;
  }

  async block(
    adminToken: JwtPayload,
    dto: ConfirmPasswordDto,
    targetId: string,
  ) {
    const admin = await this.findOneByOrFail(adminToken.sub, {
      includePassword: true,
    });
    await this.assertPasswordMatches(dto.password, admin.passwordHash);

    const user = await this.findOneByOrFail(targetId);

    if (user.isBlocked) {
      throw new ConflictException('Usuário já está bloqueado.');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para bloquear outro administrador',
      );
    }

    user.isBlocked = true;
    await this.save(user);

    await this.logService.create({
      user: admin,
      action: ActionType.BLOCK_USER,
      entityId: user.id,
      entityType: EntityType.USER,
      metadata: {
        targetEmail: user.email,
        performedByEmail: admin.email,
      },
    });

    return user;
  }

  async unblock(
    adminToken: JwtPayload,
    dto: ConfirmPasswordDto,
    targetId: string,
  ) {
    const admin = await this.findOneByOrFail(adminToken.sub, {
      includePassword: true,
    });
    await this.assertPasswordMatches(dto.password, admin.passwordHash);

    const user = await this.findOneByOrFail(targetId);

    if (!user.isBlocked) {
      throw new ConflictException('Usuário não está bloqueado.');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para desbloquear outro administrador',
      );
    }

    user.isBlocked = false;
    await this.save(user);

    await this.logService.create({
      user: admin,
      action: ActionType.UNBLOCK_USER,
      entityId: user.id,
      entityType: EntityType.USER,
      metadata: {
        targetEmail: user.email,
        performedByEmail: admin.email,
      },
    });

    return user;
  }

  async restore(targetId: string) {
    const userToRestore = await this.userRepository.findOne({
      where: { id: targetId },
      withDeleted: true,
    });

    if (!userToRestore) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!userToRestore.deletedAt) {
      throw new ConflictException('Este usuário já está ativo');
    }

    await this.userRepository.restore(targetId);

    return this.findOneByOrFail(targetId);
  }

  async removeSelf(user: JwtPayload) {
    return this.executeSoftRemove(user.sub, user);
  }

  async removeByAdmin(targetId: string, admin: JwtPayload, reason?: string) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem executar esta ação.',
      );
    }
    return this.executeSoftRemove(targetId, admin, {
      isAdminAction: true,
      reason,
    });
  }

  private async executeSoftRemove(
    targetId: string,
    requestingUser: JwtPayload,
    options: { isAdminAction?: boolean; reason?: string | null } = {},
  ) {
    const userToDelete = await this.findOneByOrFail(targetId);

    await this.assertNotLastAdmin();

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
      reason: options.reason ?? null,
    });

    return removedUser;
  }

  save(user: User) {
    return this.userRepository.save(user);
  }
}
