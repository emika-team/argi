import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DomainService } from './domain.service';
import { DomainQueueService } from './domain-queue.service';

@Injectable()
export class DomainScheduler {
  private readonly logger = new Logger(DomainScheduler.name);

  constructor(
    private readonly domainService: DomainService,
    private readonly domainQueueService: DomainQueueService
  ) {}

  // Backup job that runs every 1 hour in case queue is not working
  @Cron(CronExpression.EVERY_HOUR)
  async backupDomainCheck() {
    this.logger.log('Running backup domain expiry check (every 1 hour)...');

    try {
      const queueStats = await this.domainQueueService.getQueueStats();
      
      // Check if queue is working properly
      if (queueStats.repeatableJobs > 0) {
        this.logger.log('Bull queue is active, skipping backup check');
        return;
      }

      this.logger.warn('No repeatable jobs found in queue, running backup check');
      
      const expiringDomains = await this.domainService.getExpiringDomains(30);
      
      if (expiringDomains.length > 0) {
        this.logger.warn(`Backup check found ${expiringDomains.length} expiring domains`);
        
        // Trigger individual checks for expiring domains with slow rate to avoid bot detection
        for (const domain of expiringDomains) {
          this.logger.warn(
            `Backup check - Domain ${domain.domain} is expiring in ${domain.lastDaysUntilExpiry} days`
          );
          // Add a check job for this domain
          await this.domainQueueService.addSingleDomainCheck(domain.domain, domain._id.toString());
          // Add delay between checks to avoid bot detection
          await this.sleep(3000 + Math.random() * 2000); // 3-5 seconds between checks
        }
      } else {
        this.logger.log('Backup check - No expiring domains found');
      }

      this.logger.log('Completed backup domain expiry check');
    } catch (error) {
      this.logger.error('Error in backup domain check:', error);
    }
  }

  // Manual trigger to add all domains check to queue
  async triggerAllDomainsCheck() {
    this.logger.log('Manually triggering all domains check via queue...');
    
    try {
      await this.domainQueueService.addAllDomainsCheck();
      this.logger.log('Successfully added all domains check to queue');
    } catch (error) {
      this.logger.error('Error adding all domains check to queue:', error);
    }
  }

  // Health check to ensure queue is working
  @Cron(CronExpression.EVERY_HOUR)
  async queueHealthCheck() {
    try {
      const stats = await this.domainQueueService.getQueueStats();
      
      this.logger.debug('Queue health check:', {
        waiting: stats.waiting,
        active: stats.active,
        repeatableJobs: stats.repeatableJobs
      });

      // Alert if no repeatable jobs are scheduled
      if (stats.repeatableJobs === 0) {
        this.logger.warn('No repeatable jobs found in queue! Domain monitoring may not be working.');
      }

      // Alert if there are too many failed jobs
      if (stats.failed > 100) {
        this.logger.warn(`High number of failed jobs in queue: ${stats.failed}`);
      }

    } catch (error) {
      this.logger.error('Error in queue health check:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 