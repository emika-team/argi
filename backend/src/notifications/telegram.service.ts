import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot | null = null;
  private enabled: boolean = false;

  constructor(private configService: ConfigService) {
    const token = this.configService.get('TELEGRAM_BOT_TOKEN');
    const enabled = this.configService.get('ENABLE_TELEGRAM_ALERTS') === 'true';
    
    if (token && enabled) {
      try {
        this.bot = new TelegramBot(token, { polling: false });
        this.enabled = true;
        this.logger.log('Telegram service initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Telegram bot:', error.message);
        this.enabled = false;
      }
    } else {
      this.logger.log('Telegram alerts disabled or token not configured');
    }
  }

  async sendDomainExpiryAlert(chatId: string, domain: string, daysUntilExpiry: number, expiryDate: Date) {
    if (!this.enabled || !this.bot) {
      this.logger.debug('Telegram alerts disabled, skipping notification');
      return;
    }

    if (!chatId) {
      this.logger.warn('No Telegram chat ID provided, skipping notification');
      return;
    }

    try {
      const emoji = daysUntilExpiry < 0 ? '🚨' : daysUntilExpiry <= 7 ? '⚠️' : '⏰';
      const status = daysUntilExpiry < 0 ? 'EXPIRED' : 'EXPIRING SOON';
      
      const message = `
${emoji} *Domain ${status}*

*Domain:* ${domain}
*Days Until Expiry:* ${daysUntilExpiry}
*Expiry Date:* ${expiryDate.toLocaleDateString()}
${daysUntilExpiry < 0 ? '\n⚠️ This domain has already expired!' : daysUntilExpiry <= 7 ? '\n⚠️ Action required soon!' : ''}
      `.trim();

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      this.logger.log(`Telegram alert sent for domain ${domain} to chat ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to send Telegram alert for domain ${domain}:`, error.message);
    }
  }

  async sendBulkDomainAlert(chatId: string, domains: Array<{ domain: string; daysUntilExpiry: number; expiryDate: Date }>) {
    if (!this.enabled || !this.bot) {
      this.logger.debug('Telegram alerts disabled, skipping notification');
      return;
    }

    if (!chatId || domains.length === 0) {
      return;
    }

    try {
      let message = '⚠️ *Domain Expiry Summary*\n\n';
      
      for (const domainInfo of domains.slice(0, 10)) { // Limit to 10 domains per message
        const emoji = domainInfo.daysUntilExpiry < 0 ? '🚨' : domainInfo.daysUntilExpiry <= 7 ? '⚠️' : '⏰';
        message += `${emoji} *${domainInfo.domain}*\n`;
        message += `   Days: ${domainInfo.daysUntilExpiry} | Expires: ${domainInfo.expiryDate.toLocaleDateString()}\n\n`;
      }

      if (domains.length > 10) {
        message += `\n... and ${domains.length - 10} more domains`;
      }

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      this.logger.log(`Telegram bulk alert sent for ${domains.length} domains to chat ${chatId}`);
    } catch (error) {
      this.logger.error('Failed to send Telegram bulk alert:', error.message);
    }
  }

  async testConnection(chatId: string): Promise<boolean> {
    if (!this.enabled || !this.bot) {
      return false;
    }

    try {
      await this.bot.sendMessage(chatId, '✅ Telegram notifications are now active for domain monitoring!');
      return true;
    } catch (error) {
      this.logger.error('Failed to test Telegram connection:', error.message);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
