import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, Min, Max, IsObject, IsDate } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateDomainDto {
  @IsString()
  domain: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  enableExpiryAlerts?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  alertDaysBefore?: number;

  // 3rd Party Provider Information
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  providerStatus?: string;

  @IsOptional()
  @IsBoolean()
  isPaused?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nameServers?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  originalNameServers?: string[];

  @IsOptional()
  @IsString()
  originalRegistrar?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  activatedAt?: Date;

  @IsOptional()
  @IsObject()
  providerMetadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 