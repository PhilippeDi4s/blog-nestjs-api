import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enum/user-role.enum';
import { Min } from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  @Min(6)
  passwordHash: string;

  @Column({ type: 'boolean', default: false })
  isLogged: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  sessionExpiresAt: Date | null;

  @Column({ type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
