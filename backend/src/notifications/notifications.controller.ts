import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly telegramService: TelegramService) {}

  @UseGuards(JwtAuthGuard)
  @Post('telegram/test')
  async testTelegramConnection(@Body() body: { chatId: string }) {
    const result = await this.telegramService.testConnection(body.chatId);
    return {
      success: result,
      message: result
        ? 'Telegram connection successful! Check your Telegram for a test message.'
        : 'Failed to send Telegram message. Please check your bot token and chat ID.',
    };
  }

  @Get('telegram/status')
  async getTelegramStatus() {
    return {
      enabled: this.telegramService.isEnabled(),
      message: this.telegramService.isEnabled()
        ? 'Telegram notifications are enabled'
        : 'Telegram notifications are disabled. Please configure TELEGRAM_BOT_TOKEN and ENABLE_TELEGRAM_ALERTS.',
    };
  }
}
