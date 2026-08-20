import { Injectable, Logger } from '@nestjs/common';
import { ActivityLog } from './entities/activity.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateActivityLogDto } from './dto/create-log.dto';
import { FiltersLogDto } from './dto/filters-log.dto';

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async create(logData: CreateActivityLogDto): Promise<void> {
    try {
      const log = this.activityLogRepository.create(logData);
      await this.activityLogRepository.save(log);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha ao gravar log: ${message}`);
    }
  }

  async findMany(filters: FiltersLogDto) {
    const {
      action,
      userId,
      entityType,
      entityId,
      startDate,
      endDate,
      limit = 20,
      page = 1,
    } = filters;

    const where: FindOptionsWhere<ActivityLog> = {};

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.user = {
        id: userId,
      };
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

    const [logs, total] = await this.activityLogRepository.findAndCount({
      where,
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      total,
      page,
      limit,
    };
  }
}
