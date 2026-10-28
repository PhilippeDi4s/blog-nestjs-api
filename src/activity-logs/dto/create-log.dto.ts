import { User } from 'src/user/entities/user.entity';
import { EntityType } from '../enums/entity-type.enum';
import { ActionType } from '../enums/action-type.enum';

export class CreateActivityLogDto {
  user: User;
  entityType: EntityType;
  entityId: string;
  affectedUserId: string | null;
  action: ActionType;
  metadata: Record<string, unknown>;
  reason?: string | null;
}
