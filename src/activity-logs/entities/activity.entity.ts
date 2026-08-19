import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActionType } from '../enums/action-type.enum';
import { EntityType } from '../enums/entity-type.enum';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'enum', enum: EntityType })
  entityType: EntityType;

  @Column()
  entityId: string;

  @Column({ type: 'enum', enum: ActionType })
  action: ActionType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
