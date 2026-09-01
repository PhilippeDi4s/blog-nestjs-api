import { IsNotEmpty, IsString } from 'class-validator';
import { AdminActionReasonDto } from 'src/activity-logs/dto/admin-action-reason.dto';

export class ConfirmAdminActionDto extends AdminActionReasonDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
