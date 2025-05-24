import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CloudflareCredentialsDto {
  @IsString()
  email: string;

  @IsString()
  apiKey: string;
}

export class ImportDomainsDto {
  @IsString()
  userId: string;

  @IsString()
  email: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  accountId?: string;
}

export class CloudflareDomainInfo {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers: string[];
  original_name_servers: string[];
  original_registrar: string;
  original_dnshost: string;
  created_on: string;
  modified_on: string;
  activated_on: string;
} 