import { IsString, IsUrl, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { MonitorType } from '../schemas/monitor.schema';

export class CreateMonitorDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsEnum(MonitorType)
  @IsOptional()
  type?: MonitorType;

  @IsNumber()
  @IsOptional()
  interval?: number;

  @IsNumber()
  @IsOptional()
  timeout?: number;

  @IsNumber()
  @IsOptional()
  maxRetries?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  enableEmailAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  enableLineAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  enableDiscordAlerts?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alertEmails?: string[];
} 