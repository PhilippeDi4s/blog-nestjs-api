import { Injectable, Logger } from '@nestjs/common';
import { ActivityLog } from './entities/activity.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiltersLogDto } from './dto/filters-log.dto';
import {
  CreateActivityLogInput,
  LoggableAction,
} from './types/log-metadata.types';

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async create<A extends LoggableAction, T>(
    logData: CreateActivityLogInput<A, T>,
  ): Promise<void> {
    try {
      const log = this.activityLogRepository.create({
        ...logData,
        metadata: logData.metadata,
      });
      await this.activityLogRepository.save(log);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha ao gravar log: ${message}`);
    }
  }

  async findMany(filters: FiltersLogDto) {
    const {
      activityLogId,
      action,
      actorId,
      entityType,
      entityId,
      affectedUserId,
      startDate,
      endDate,
      limit = 8,
      page = 1,
    } = filters;

    const query = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.user', 'actor')
      .leftJoin('log.affectedUser', 'affectedUser')
      .addSelect(['actor.id', 'actor.name', 'actor.email']);

    query.addSelect([
      'affectedUser.id',
      'affectedUser.name',
      'affectedUser.email',
    ]);

    if (activityLogId) {
      query.andWhere('log.activityLogId = :activityLogId', { activityLogId });
    } else {
      if (action) {
        query.andWhere('log.action = :action', { action });
      }

      if (actorId) {
        query.andWhere('log.userId = :actorId', { actorId });
      }

      if (entityType) {
        query.andWhere('log.entityType = :entityType', { entityType });
      }

      if (entityId) {
        query.andWhere('log.entityId = :entityId', { entityId });
      }

      if (affectedUserId) {
        query.andWhere('log.affectedUserId = :affectedUserId', {
          affectedUserId,
        });
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
