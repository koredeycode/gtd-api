import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class HabitDto {
  @ApiProperty({ example: 'uuid-v4' })
  @IsUUID()
  id!: string;
  @ApiProperty({ example: 'uuid-v4' })
  @IsUUID()
  user_id!: string;
  @ApiProperty({ example: 'uuid-v4' })
  @IsUUID()
  category_id!: string;
  @ApiProperty({ example: 'Drink Water' })
  @IsString()
  title!: string;
  @ApiProperty({ example: { type: 'daily' } })
  @IsObject()
  frequency_json!: any;
  @ApiProperty({ example: '2023-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsString()
  created_at?: string;
  @ApiProperty({ example: '2023-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsString()
  updated_at?: string;
  @ApiProperty({ example: '2023-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsString()
  deleted_at?: string;
}

export class LogDto {
  @ApiProperty({ example: 'uuid-v4' })
  @IsUUID()
  id!: string;
  @ApiProperty({ example: 'uuid-v4' })
  @IsUUID()
  habit_id!: string;
  @ApiProperty({ example: 'uuid-v4' })
  @IsUUID()
  user_id!: string;
  @ApiProperty({ example: '2023-01-01' })
  @IsString()
  date!: string;
  @ApiProperty({ example: 'Note', required: false })
  @IsOptional()
  @IsString()
  text?: string;
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  value?: boolean;
  @ApiProperty({ example: '2023-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsString()
  created_at?: string;
  @ApiProperty({ example: '2023-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsString()
  updated_at?: string;
  @ApiProperty({ example: '2023-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsString()
  deleted_at?: string;
}

export class SyncChangesDto {
  @ApiProperty({ type: [HabitDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HabitDto)
  created: HabitDto[] = [];

  @ApiProperty({ type: [HabitDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HabitDto)
  updated: HabitDto[] = [];

  @ApiProperty({ example: ['uuid-v4-to-delete'] })
  @IsArray()
  deleted: string[] = [];
}

export class SyncLogsDto {
  @ApiProperty({ type: [LogDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogDto)
  created: LogDto[] = [];

  @ApiProperty({ type: [LogDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogDto)
  updated: LogDto[] = [];

  @ApiProperty({ example: ['uuid-v4-to-delete'] })
  @IsArray()
  deleted: string[] = [];
}

export class SyncPayloadDto {
  @ApiProperty({ type: SyncChangesDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SyncChangesDto)
  habits!: SyncChangesDto;

  @ApiProperty({ type: SyncLogsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SyncLogsDto)
  logs!: SyncLogsDto;
}

export class PushInputDto {
  @ApiProperty({ type: SyncPayloadDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SyncPayloadDto)
  changes!: SyncPayloadDto;
}

export class PullInputDto {
  @ApiProperty({ example: 1701700000, description: 'Timestamp of last successful pull (seconds)' })
  @IsNumber()
  last_pulled_at!: number;
}
