import { UserRole } from 'src/user/enum/user-role.enum';

export type JwtPayload = {
  sub: string;
  role: UserRole;
};
