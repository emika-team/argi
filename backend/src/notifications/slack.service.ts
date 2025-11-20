import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface SlackNotificationPayload {
  text?: string;
  blocks?: any[];
  attachments?: any[];
}

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private axiosInstance: AxiosInstance;
  private webhookUrl: string;
  private enabled: boolean;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
    this.enabled = this.configService.get<string>('ENABLE_SLACK_ALERTS') === 'true' && !!this.webhookUrl;

    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (this.enabled) {
      this.logger.log('Slack notifications enabled');
    } else {
      this.logger.log('Slack notifications disabled');
    }
  }

  async sendDomainExpiryAlert(domain: string, daysUntilExpiry: number, expiryDate: string): Promise<void> {
    if (!this.enabled) {
      this.logger.debug('Slack notifications disabled, skipping domain expiry alert');
      return;
    }

    try {
      const emoji = daysUntilExpiry <= 7 ? '🚨' : daysUntilExpiry <= 30 ? '⚠️' : 'ℹ️';
      const urgency = daysUntilExpiry <= 7 ? 'URGENT' : daysUntilExpiry <= 30 ? 'WARNING' : 'NOTICE';
      const color = daysUntilExpiry <= 7 ? 'danger' : daysUntilExpiry <= 30 ? 'warning' : 'good';

      const payload: SlackNotificationPayload = {
        text: `${emoji} Domain Expiry Alert: ${domain}`,
        attachments: [
          {
            color,
            title: `${emoji} ${urgency}: Domain Expiring Soon`,
            fields: [
              {
                title: 'Domain',
                value: domain,
                short: true,
              },
              {
                title: 'Days Until Expiry',
                value: `${daysUntilExpiry} days`,
                short: true,
              },
              {
                title: 'Expiry Date',
                value: new Date(expiryDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                short: true,
              },
              {
                title: 'Checked At',
                value: new Date().toLocaleString('en-US'),
                short: true,
              },
            ],
            footer: 'Domain Monitor',
            footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      await this.sendNotification(payload);
      this.logger.log(`Sent Slack notification for domain ${domain} (${daysUntilExpiry} days until expiry)`);
    } catch (error) {
      this.logger.error(`Failed to send Slack notification for domain ${domain}:`, error.message);
    }
  }

  async sendDomainExpiredAlert(domain: string): Promise<void> {
    if (!this.enabled) {
      this.logger.debug('Slack notifications disabled, skipping domain expired alert');
      return;
    }

    try {
      const payload: SlackNotificationPayload = {
        text: `🚨 CRITICAL: Domain Expired - ${domain}`,
        attachments: [
          {
            color: 'danger',
            title: '🚨 CRITICAL: Domain Has Expired',
            fields: [
              {
                title: 'Domain',
                value: domain,
                short: true,
              },
              {
                title: 'Status',
                value: 'EXPIRED',
                short: true,
              },
              {
                title: 'Checked At',
                value: new Date().toLocaleString('en-US'),
                short: false,
              },
            ],
            footer: 'Domain Monitor',
            footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      await this.sendNotification(payload);
      this.logger.log(`Sent Slack notification for expired domain ${domain}`);
    } catch (error) {
      this.logger.error(`Failed to send Slack notification for expired domain ${domain}:`, error.message);
    }
  }

  async sendBulkDomainReport(expiringDomains: Array<{ domain: string; daysUntilExpiry: number }>): Promise<void> {
    if (!this.enabled || expiringDomains.length === 0) {
      return;
    }

    try {
      const critical = expiringDomains.filter(d => d.daysUntilExpiry <= 7).length;
      const warning = expiringDomains.filter(d => d.daysUntilExpiry > 7 && d.daysUntilExpiry <= 30).length;

      const domainsList = expiringDomains
        .slice(0, 10)
        .map(d => `• ${d.domain} - ${d.daysUntilExpiry} days`)
        .join('\n');

      const moreText = expiringDomains.length > 10 ? `\n_...and ${expiringDomains.length - 10} more_` : '';

      const payload: SlackNotificationPayload = {
        text: `📊 Domain Expiry Report: ${expiringDomains.length} domains expiring soon`,
        attachments: [
          {
            color: critical > 0 ? 'danger' : 'warning',
            title: '📊 Domain Expiry Summary',
            fields: [
              {
                title: 'Total Expiring',
                value: expiringDomains.length.toString(),
                short: true,
              },
              {
                title: 'Critical (≤7 days)',
                value: critical.toString(),
                short: true,
              },
              {
                title: 'Warning (8-30 days)',
                value: warning.toString(),
                short: true,
              },
            ],
            text: `*Domains:*\n${domainsList}${moreText}`,
            footer: 'Domain Monitor',
            footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      await this.sendNotification(payload);
      this.logger.log(`Sent Slack bulk domain report for ${expiringDomains.length} domains`);
    } catch (error) {
      this.logger.error('Failed to send Slack bulk domain report:', error.message);
    }
  }

  private async sendNotification(payload: SlackNotificationPayload): Promise<void> {
    if (!this.enabled || !this.webhookUrl) {
      this.logger.debug('Slack notifications not configured');
      return;
    }

    try {
      await this.axiosInstance.post(this.webhookUrl, payload);
    } catch (error) {
      this.logger.error('Failed to send Slack notification:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
