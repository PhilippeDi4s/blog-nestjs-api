import type { User } from 'src/user/entities/user.entity';

export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'LOGGED_OUT';

export function getSessionStatus(user: User): SessionStatus {
  if (!user.isLogged) return 'LOGGED_OUT';
  if (!user.sessionExpiresAt || user.sessionExpiresAt <= new Date()) {
    return 'EXPIRED';
  }
  return 'ACTIVE';
}
