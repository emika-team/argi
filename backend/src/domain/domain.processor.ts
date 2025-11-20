import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bull';
import { DomainService } from './domain.service';
import { DOMAIN_MONITORING_QUEUE_PREFIX, DomainMonitoringJob } from './domain-queue.service';
import { SlackService } from '../notifications/slack.service';

@Injectable()
export class DomainProcessorFactory {
  private readonly logger = new Logger(DomainProcessorFactory.name);
  private processors: Map<string, DomainProcessor> = new Map();

  constructor(
    private readonly domainService: DomainService,
    private readonly slackService: SlackService
  ) {}

  createProcessorForDomain(domain: string): DomainProcessor {
    if (this.processors.has(domain)) {
      return this.processors.get(domain);
    }

    const processor = new DomainProcessor(domain, this.domainService, this.slackService);
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
    private readonly slackService: SlackService
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

      const result = await this.domainService.checkDomainExpiry(domain);
      
      if (domainId) {
        await this.domainService.updateDomainStatus(domainId, result);
      }

      if (result.error) {
        this.logger.warn(`Domain check completed with error for ${domain}: ${result.error}`);
      } else if (result.isExpired) {
        this.logger.error(`Domain EXPIRED: ${domain}`);
        // Send Slack notification for expired domain
        await this.slackService.sendDomainExpiredAlert(domain);
      } else if (result.isExpiringSoon) {
        this.logger.warn(`Domain alert: ${domain} - ${result.daysUntilExpiry} days until expiry`);
        // Send Slack notification for expiring domain
        if (result.expiryDate) {
          await this.slackService.sendDomainExpiryAlert(domain, result.daysUntilExpiry, result.expiryDate);
        }
      } else {
        this.logger.log(`Domain check completed successfully for ${domain} - ${result.daysUntilExpiry} days until expiry`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error checking domain ${domain}:`, error);
      throw error;
    }
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