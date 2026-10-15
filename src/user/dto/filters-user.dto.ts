import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { UserRole } from '../enum/user-role.enum';
import type { SessionStatus } from 'src/auth/types/session-status';

export class FiltersUserDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @Transform(({ value }): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isLogged?: boolean;

  @IsOptional()
  @Transform(({ value }): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(['ACTIVE', 'EXPIRED', 'LOGGED_OUT'])
  sessionStatus?: SessionStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  sessionExpiresStartDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  sessionExpiresEndDate?: Date;
}
