import { AdminActionReasonDto } from 'src/activity-logs/dto/admin-action-reason.dto';
import { UpdateUserDto } from './update-user.dto';
import { IntersectionType } from '@nestjs/mapped-types';

export class UpdateUserAdminDto extends IntersectionType(
  UpdateUserDto,
  AdminActionReasonDto,
) {}
