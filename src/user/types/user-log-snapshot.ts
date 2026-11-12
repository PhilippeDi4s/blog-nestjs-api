import { User } from '../entities/user.entity';

export interface UserLogSnapshot {
  name: string;
  email: string;
  role: User['role'];
}

export interface UserProfileLogSnapshot {
  name: string;
  email: string;
}

export function toUserLogSnapshot(user: User): UserLogSnapshot {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function toUserProfileLogSnapshot(user: User): UserProfileLogSnapshot {
  return {
    name: user.name,
    email: user.email,
  };
}
