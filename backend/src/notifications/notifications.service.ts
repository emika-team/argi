import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendDownAlert(monitor: any, error: string) {
    if (!monitor.enableEmailAlerts) return;

    const subject = `🚨 ${monitor.name} is DOWN`;
    const html = `
      <h2>Monitor Alert: ${monitor.name}</h2>
      <p><strong>Status:</strong> DOWN</p>
      <p><strong>URL:</strong> ${monitor.url}</p>
      <p><strong>Error:</strong> ${error}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    `;

    await this.sendEmail(monitor.alertEmails, subject, html);
  }

  async sendUpAlert(monitor: any) {
    if (!monitor.enableEmailAlerts) return;

    const subject = `✅ ${monitor.name} is UP`;
    const html = `
      <h2>Monitor Alert: ${monitor.name}</h2>
      <p><strong>Status:</strong> UP</p>
      <p><strong>URL:</strong> ${monitor.url}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    `;

    await this.sendEmail(monitor.alertEmails, subject, html);
  }

  private async sendEmail(to: string[], subject: string, html: string) {
    if (!to || to.length === 0) return;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('FROM_EMAIL'),
        to: to.join(','),
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
} 