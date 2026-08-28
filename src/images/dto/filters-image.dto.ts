import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class FiltersImagetDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  url?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  userName?: string;

  @IsOptional()
  userEmail?: string;

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
}
