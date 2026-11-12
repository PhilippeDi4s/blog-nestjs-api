import { User } from 'src/user/entities/user.entity';
import { ActionType } from '../enums/action-type.enum';
import { EntityType } from '../enums/entity-type.enum';

export interface BaseLogMetadata {
  isAdminAction: boolean;
}

export interface RestoreLogMetadata extends BaseLogMetadata {
  deletedAt: Date;
}

export interface UpdateLogMetadata<T> extends BaseLogMetadata {
  before: T;
  after: T;
}

export interface CreateLogMetadata<T> extends BaseLogMetadata {
  created: T;
}

export interface DeleteLogMetadata<T> extends BaseLogMetadata {
  deleted: T;
}
export interface LogMetadataMap<T> {
  [ActionType.UPDATED]: UpdateLogMetadata<T>;
  [ActionType.CREATED]: CreateLogMetadata<T>;
  [ActionType.DELETED]: DeleteLogMetadata<T>;
  [ActionType.LOGIN]: BaseLogMetadata;
  [ActionType.LOGOUT]: BaseLogMetadata;
  [ActionType.PASSWORD_CHANGE]: BaseLogMetadata;
  [ActionType.BLOCK_USER]: BaseLogMetadata;
  [ActionType.UNBLOCK_USER]: BaseLogMetadata;
  [ActionType.RESTORED]: RestoreLogMetadata;
}

export type LoggableAction = keyof LogMetadataMap<unknown>;

export type AnyLogMetadata = LogMetadataMap<unknown>[LoggableAction];

export interface CreateActivityLogInput<A extends LoggableAction, T> {
  user: User;
  entityType: EntityType;
  entityId: string;
  affectedUserId: string | null;
  action: A;
  metadata: LogMetadataMap<T>[A];
  reason?: string | null;
}
