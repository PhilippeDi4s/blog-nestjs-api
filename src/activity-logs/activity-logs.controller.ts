import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/user/enum/user-role.enum';
import { FiltersImagetDto } from 'src/images/dto/filters-image.dto';
import { LogResponseDto } from './dto/log-response.dto';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  async findMany(@Query() filters: FiltersImagetDto) {
    const logs = await this.activityLogsService.findMany(filters);
    return {
      ...logs,
      data: logs.data.map((log) => new LogResponseDto(log)),
    };
  }
}
