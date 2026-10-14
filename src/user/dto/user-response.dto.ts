import { getSessionStatus, SessionStatus } from 'src/auth/types/session-status';
import { User } from '../entities/user.entity';
import { UserRole } from '../enum/user-role.enum';

export class UserResponseDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly isLogged: boolean;
  readonly sessionExpiresAt: Date | null;
  readonly sessionStatus: SessionStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.isLogged = user.isBlocked;
    this.sessionExpiresAt = user.sessionExpiresAt;
    this.sessionStatus = getSessionStatus(user);
    this.role = user.role;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.deletedAt = user.deletedAt;
  }
}
