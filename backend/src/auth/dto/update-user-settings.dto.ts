import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsString()
  telegramChatId?: string;

  @IsOptional()
  @IsBoolean()
  enableTelegramAlerts?: boolean;

  @IsOptional()
  @IsString()
  cloudflareEmail?: string;

  @IsOptional()
  @IsString()
  cloudflareApiKey?: string;
}
