import { IntersectionType } from '@nestjs/mapped-types';
import { UpdatePostDto } from './update-post.dto';
import { AdminActionReasonDto } from 'src/activity-logs/dto/admin-action-reason.dto';

export class UpdatePostAdminDto extends IntersectionType(
  UpdatePostDto,
  AdminActionReasonDto,
) {}
