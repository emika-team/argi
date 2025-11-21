import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bull';
import { DomainService } from './domain.service';
import { DOMAIN_MONITORING_QUEUE_PREFIX, DomainMonitoringJob } from './domain-queue.service';
import { TelegramService } from '../notifications/telegram.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserDocument } from '../auth/schemas/user.schema';

@Injectable()
export class DomainProcessorFactory {
  private readonly logger = new Logger(DomainProcessorFactory.name);
  private processors: Map<string, DomainProcessor> = new Map();

  constructor(
    private readonly domainService: DomainService,
    private readonly telegramService: TelegramService,
    private readonly notificationsService: NotificationsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  createProcessorForDomain(domain: string): DomainProcessor {
    if (this.processors.has(domain)) {
      return this.processors.get(domain);
    }

    const processor = new DomainProcessor(
      domain,
      this.domainService,
      this.telegramService,
      this.notificationsService,
      this.userModel
    );
    this.processors.set(domain, processor);
    
    this.logger.log(`Created processor for domain: ${domain}`);
    return processor;
  }

  getProcessor(domain: string): DomainProcessor | undefined {
    return this.processors.get(domain);
  }

  removeProcessor(domain: string): void {
    this.processors.delete(domain);
    this.logger.log(`Removed processor for domain: ${domain}`);
  }

  getAllProcessors(): Map<string, DomainProcessor> {
    return this.processors;
  }
}

export class DomainProcessor {
  private readonly logger = new Logger(`DomainProcessor-${this.domain}`);

  constructor(
    private readonly domain: string,
    private readonly domainService: DomainService,
    private readonly telegramService: TelegramService,
    private readonly notificationsService: NotificationsService,
    private readonly userModel: Model<UserDocument>
  ) {}

  async processJob(job: Job<DomainMonitoringJob>) {
    const { type, domain, domainId } = job.data;
    
    this.logger.log(`Processing job ${type} for domain: ${domain}`);

    try {
      if (type === 'check-domain-expiry') {
        return await this.handleDomainExpiryCheck(job);
      } else {
        this.logger.warn(`Unknown job type: ${type}`);
        return;
      }
    } catch (error) {
      this.logger.error(`Error processing job for domain ${domain}:`, error);
      throw error;
    }
  }

  private async handleDomainExpiryCheck(job: Job<DomainMonitoringJob>) {
    const { domain, domainId } = job.data;
    
    this.logger.log(`Checking domain expiry for: ${domain}`);

    try {
      if (!domain) {
        this.logger.warn(`No domain provided for job ${job.id}`);
        return;
      }

      // Add a small delay to avoid bot detection (slow check)
      await this.sleep(2000 + Math.random() * 3000); // Random delay between 2-5 seconds

      const result = await this.domainService.checkDomainExpiry(domain);
      
      if (domainId) {
        await this.domainService.updateDomainStatus(domainId, result);

        // Send notifications if domain is expiring soon or expired
        if (!result.error && (result.isExpiringSoon || result.isExpired)) {
          await this.sendNotifications(domainId, result);
        }
      }

      if (result.error) {
        this.logger.warn(`Domain check completed with error for ${domain}: ${result.error}`);
      } else if (result.isExpiringSoon || result.isExpired) {
        this.logger.warn(`Domain alert: ${domain} - ${result.daysUntilExpiry} days until expiry`);
      } else {
        this.logger.log(`Domain check completed successfully for ${domain} - ${result.daysUntilExpiry} days until expiry`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error checking domain ${domain}:`, error);
      throw error;
    }
  }

  private async sendNotifications(domainId: string, result: any) {
    try {
      // Get domain details to find userId
      const domainDoc = await this.domainService['domainModel'].findById(domainId).exec();
      if (!domainDoc || !domainDoc.userId) {
        this.logger.warn(`Domain ${domainId} not found or has no userId`);
        return;
      }

      // Get user details for notification settings
      const user = await this.userModel.findById(domainDoc.userId).exec();
      if (!user) {
        this.logger.warn(`User ${domainDoc.userId} not found`);
        return;
      }

      // Send Telegram notification if enabled
      if (user.enableTelegramAlerts && user.telegramChatId) {
        await this.telegramService.sendDomainExpiryAlert(
          user.telegramChatId,
          result.domain,
          result.daysUntilExpiry,
          new Date(result.expiryDate)
        );
      }

      // Send email notification if enabled and domain has alerts enabled
      if (domainDoc.enableExpiryAlerts && user.email) {
        await this.notificationsService.sendDomainExpiryAlert(
          result.domain,
          result.daysUntilExpiry,
          new Date(result.expiryDate),
          [user.email]
        );
      }

      this.logger.log(`Notifications sent for domain ${result.domain}`);
    } catch (error) {
      this.logger.error(`Error sending notifications for domain ${domainId}:`, error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDomain(): string {
    return this.domain;
  }
}

// Legacy processor for backward compatibility (will be removed)
@Injectable()
export class LegacyDomainProcessor {
  private readonly logger = new Logger('LegacyDomainProcessor');

  constructor(private readonly domainService: DomainService) {}

  // Keep existing methods for any remaining legacy jobs
  async handleSingleDomainCheck(job: Job<any>) {
    this.logger.warn('Legacy single domain check - this should be migrated to individual domain queues');
    // Handle legacy job format if needed
  }

  async handleUserDomainsCheck(job: Job<any>) {
    this.logger.warn('Legacy user domains check - this should be migrated to individual domain queues');
    // Handle legacy job format if needed
  }

  async handleAllDomainsCheck(job: Job<any>) {
    this.logger.warn('Legacy all domains check - this should be migrated to individual domain queues');
    // Handle legacy job format if needed
  }
} 