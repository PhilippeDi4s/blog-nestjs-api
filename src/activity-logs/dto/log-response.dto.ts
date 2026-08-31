import { ActivityLog } from '../entities/activity.entity';
import { ActionType } from '../enums/action-type.enum';
import { EntityType } from '../enums/entity-type.enum';

export class LogResponseDto {
  readonly activityLogId: string;
  readonly user: {
    id: string;
    name: string;
    email: string;
  };
  readonly action: ActionType;
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly metadata: Record<string, unknown> | null;
  readonly reason: string | null;
  readonly createdAt: Date;

  constructor(log: ActivityLog) {
    this.activityLogId = log.activityLogId;
    this.user = {
      id: log.user.id,
      name: log.user.name,
      email: log.user.email,
    };
    this.action = log.action;
    this.entityType = log.entityType;
    this.entityId = log.entityId;
    this.metadata = log.metadata;
    this.reason = log.reason;
    this.createdAt = log.createdAt;
  }
}
