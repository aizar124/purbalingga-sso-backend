import { IsOptional, IsString, IsObject, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateTokenDto {
  @IsString()
  token: string;
}

export class ActivityDto {
  @IsString()
  action: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class LastActiveDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class DateRangeDto {
  @IsString()
  @IsOptional()
  date?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  limit?: number = 20;
}

export class UserListQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  limit?: number = 100;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;
}
