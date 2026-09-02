import { User } from '../entities/user.entity';
import { UserRole } from '../enum/user-role.enum';

export class UserResponseDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly isBlocked: boolean;
  readonly forceLogout: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.isBlocked = user.isBlocked;
    this.forceLogout = user.forceLogout;
    this.role = user.role;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.deletedAt = user.deletedAt;
  }
}
