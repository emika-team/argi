import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, Min, Max } from 'class-validator';

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
} 