import { Injectable, Logger } from '@nestjs/common';
import { ActivityLog } from './entities/activity.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActivityLogDto } from './dto/create-log.dto';
import { FiltersLogDto } from './dto/filters-log.dto';
import { User } from 'src/user/entities/user.entity';

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
      id,
      action,
      userId,
      entityType,
      entityId,
      startDate,
      endDate,
      limit = 20,
      page = 1,
    } = filters;

    const query = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .leftJoin(
        User,
        'entity',
        'entity.id = CAST(log.entityId AS uuid) AND log.entityType = :entityType',
        { entityType: 'USER' },
      )
      .addSelect([
        'user.id',
        'user.name',
        'user.email',
        'entity.id',
        'entity.name',
        'entity.email',
      ]);
    if (id) {
      query.andWhere('log.id = :id', { id });
    } else {
      if (action) {
        query.andWhere('log.action = :action', { action });
      }

      if (userId) {
        query.andWhere('log.userId = :userId', { userId });
      }

      if (entityType) {
        query.andWhere('log.entityType = :entityType', { entityType });
      }

      if (entityId) {
        query.andWhere('log.entityId = :entityId', { entityId });
      }

      if (startDate && endDate) {
        query.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (startDate) {
        query.andWhere('log.createdAt >= :startDate', { startDate });
      } else if (endDate) {
        query.andWhere('log.createdAt <= :endDate', { endDate });
      }
    }

    const [logs, count] = await query
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: logs,
      total: count,
      page,
      limit,
    };
  }
}
