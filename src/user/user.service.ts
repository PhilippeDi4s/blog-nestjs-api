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
import { Brackets, Repository } from 'typeorm';
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
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ConfirmAdminActionDto } from '../commoun/dto/confirm-admin-action.dto';

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

  async assertPasswordMatchesByUserId(
    userId: string,
    password: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.assertPasswordMatches(password, user.passwordHash);
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
      role,
      isBlocked,
      isLogged,
      startDate,
      endDate,
      sessionStatus,
      sessionExpiresStartDate,
      sessionExpiresEndDate,
      page = 1,
      limit = 20,
    } = filters;

    const query = this.userRepository.createQueryBuilder('user');

    if (id) {
      query.andWhere('user.id = :id', { id });
    } else {
      if (name) {
        query.andWhere('unaccent(user.name) ILIKE unaccent(:name)', {
          name: `%${name}%`,
        });
      }
      if (email) {
        query.andWhere('user.email ILIKE :email', {
          email: `%${email}%`,
        });
      }
      if (role) {
        query.andWhere('user.role = :role', { role });
      }
      if (isBlocked !== undefined) {
        query.andWhere('user.isBlocked = :isBlocked', { isBlocked });
      }
      if (isLogged !== undefined) {
        query.andWhere('user.isLogged = :isLogged', { isLogged });
      }
      if (startDate && endDate) {
        query.andWhere('user.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (startDate) {
        query.andWhere('user.createdAt >= :startDate', { startDate });
      } else if (endDate) {
        query.andWhere('user.createdAt <= :endDate', { endDate });
      }
      if (sessionStatus === 'ACTIVE') {
        query
          .andWhere('user.isLogged = :activeLogged', {
            activeLogged: true,
          })
          .andWhere('user.sessionExpiresAt > :now', {
            now: new Date(),
          });
      }
      if (sessionStatus === 'EXPIRED') {
        query
          .andWhere('user.isLogged = :expiredLogged', {
            expiredLogged: true,
          })
          .andWhere(
            new Brackets((qb) => {
              qb.where('user.sessionExpiresAt IS NULL').orWhere(
                'user.sessionExpiresAt <= :now',
                {
                  now: new Date(),
                },
              );
            }),
          );
      }
      if (sessionStatus === 'LOGGED_OUT') {
        query.andWhere('user.isLogged = :loggedOut', {
          loggedOut: false,
        });
      }
      if (sessionExpiresStartDate && sessionExpiresEndDate) {
        query.andWhere(
          'user.sessionExpiresAt BETWEEN :sessionExpiresStartDate AND :sessionExpiresEndDate',
          {
            sessionExpiresStartDate,
            sessionExpiresEndDate,
          },
        );
      } else if (sessionExpiresStartDate) {
        query.andWhere('user.sessionExpiresAt >= :sessionExpiresStartDate', {
          sessionExpiresStartDate,
        });
      } else if (sessionExpiresEndDate) {
        query.andWhere('user.sessionExpiresAt <= :sessionExpiresEndDate', {
          sessionExpiresEndDate,
        });
      }
    }

    const [users, count] = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: users,
      total: count,
      page,
      limit,
    };
  }

  async updateSelf(user: JwtPayload, dto: UpdateUserDto) {
    const updatedUser = await this.executeUpdate(user.sub, user, dto);
    return updatedUser;
  }

  async updateByAdmin(
    admin: JwtPayload,
    targetId: string,
    dto: UpdateUserAdminDto,
  ) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este usuário',
      );
    }
    const { reason, ...userData } = dto;
    const updatedUser = await this.executeUpdate(targetId, admin, userData, {
      isAdminAction: true,
      reason,
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
      userToUpdate.isLogged = true;
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
    user.isLogged = true;

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
    dto: ConfirmAdminActionDto,
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
      reason: dto.reason,
    });

    return user;
  }

  async demote(
    adminToken: JwtPayload,
    dto: ConfirmAdminActionDto,
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
      reason: dto.reason,
    });

    return user;
  }

  async block(
    adminToken: JwtPayload,
    dto: ConfirmAdminActionDto,
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
    user.isLogged = false;
    user.sessionExpiresAt = null;

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
      reason: dto.reason,
    });

    return user;
  }

  async unblock(
    adminToken: JwtPayload,
    dto: ConfirmAdminActionDto,
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
      reason: dto.reason,
    });

    return user;
  }

  async restore(
    admin: JwtPayload,
    targetId: string,
    dto: ConfirmAdminActionDto,
  ) {
    await this.assertPasswordMatchesByUserId(admin.sub, dto.password);
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

    const deletedAt = userToRestore.deletedAt;

    await this.userRepository.restore(userToRestore.id);

    const retoredUser = await this.findOneByOrFail(userToRestore.id);

    await this.logService.create({
      user: { id: admin.sub } as User,
      action: ActionType.RESTORED,
      entityId: retoredUser.id,
      entityType: EntityType.USER,
      metadata: {
        deletedAt: deletedAt,
      },
      reason: dto.reason,
    });

    return retoredUser;
  }

  async removeSelf(user: JwtPayload) {
    return this.executeSoftRemove(user.sub, user);
  }

  async removeByAdmin(
    targetId: string,
    admin: JwtPayload,
    dto: ConfirmAdminActionDto,
  ) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem executar esta ação.',
      );
    }
    return this.executeSoftRemove(targetId, admin, {
      isAdminAction: true,
      reason: dto.reason,
      password: dto.password,
    });
  }

  private async executeSoftRemove(
    targetId: string,
    requestingUser: JwtPayload,
    options: {
      isAdminAction?: boolean;
      reason?: string;
      password?: string;
    } = {},
  ) {
    if (options.isAdminAction && !options.password) {
      throw new BadRequestException('A senha é obrigatória');
    }

    if (options.isAdminAction) {
      await this.assertPasswordMatchesByUserId(
        requestingUser.sub,
        options.password!,
      );
    }

    const userToDelete = await this.findOneByOrFail(targetId);

    if (userToDelete.role === UserRole.ADMIN) {
      await this.assertNotLastAdmin();
    }

    userToDelete.isLogged = false;
    userToDelete.sessionExpiresAt = null;

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
