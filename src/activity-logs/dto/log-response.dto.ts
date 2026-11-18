import { User } from 'src/user/entities/user.entity';
import { ActivityLog } from '../entities/activity.entity';
import { ActionType } from '../enums/action-type.enum';
import { EntityType } from '../enums/entity-type.enum';
import { AnyLogMetadata } from '../types/log-metadata.types';

export class LogResponseDto {
  readonly activityLogId: string;
  readonly actor: Omit<User, 'passwordHash' | 'sessionExpiresAt' | 'isLogged'>;
  readonly action: ActionType;
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly affectedUser: Omit<
    User,
    'passwordHash' | 'sessionExpiresAt' | 'isLogged'
  > | null;
  readonly metadata: AnyLogMetadata | null;
  readonly reason: string | null;
  readonly createdAt: Date;

  constructor(log: ActivityLog) {
    this.activityLogId = log.activityLogId;
    this.actor = {
      id: log.user.id,
      name: log.user.name,
      email: log.user.email,
      createdAt: log.user.createdAt,
      deletedAt: log.user.deletedAt,
      isBlocked: log.user.isBlocked,
      role: log.user.role,
      updatedAt: log.user.updatedAt,
    };
    this.action = log.action;
    this.entityType = log.entityType;
    this.entityId = log.entityId;
    this.affectedUser = log.affectedUser
      ? {
          id: log.affectedUser.id,
          name: log.affectedUser.name,
          email: log.affectedUser.email,
          createdAt: log.affectedUser.createdAt,
          deletedAt: log.affectedUser.deletedAt,
          isBlocked: log.affectedUser.isBlocked,
          role: log.affectedUser.role,
          updatedAt: log.affectedUser.updatedAt,
        }
      : null;

    this.metadata = log.metadata;
    this.reason = log.reason;
    this.createdAt = log.createdAt;
  }
}
