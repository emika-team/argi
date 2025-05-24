import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DOMAIN_QUEUE, DomainMonitoringJob } from './domain.processor';

@Injectable()
export class DomainQueueService implements OnModuleInit {
  private readonly logger = new Logger(DomainQueueService.name);

  constructor(
    @InjectQueue(DOMAIN_QUEUE) private readonly domainQueue: Queue<DomainMonitoringJob>
  ) {}

  async onModuleInit() {
    // Setup repeatable job for monitoring all domains every 5 minutes
    await this.setupDomainMonitoringJob();
  }

  private async setupDomainMonitoringJob() {
    try {
      // Remove existing repeatable jobs with the same name to avoid duplicates
      const repeatableJobs = await this.domainQueue.getRepeatableJobs();
      for (const job of repeatableJobs) {
        if (job.name == 'check-all-domains') {
          await this.domainQueue.removeRepeatableByKey(job.key);
        }
      }

      // Add new repeatable job every 5 minutes
      await this.domainQueue.add(
        'check-all-domains',
        { type: 'check-all-domains' },
        {
          repeat: { 
            cron: '*/1 * * * *' // Every 5 minutes
          },
          removeOnComplete: 10, // Keep last 10 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
        }
      );

      this.logger.log('Domain monitoring job scheduled to run every 5 minutes');
    } catch (error) {
      this.logger.error('Failed to setup domain monitoring job:', error);
    }
  }

  async addSingleDomainCheck(domain: string, domainId?: string): Promise<void> {
    await this.domainQueue.add(
      'check-single-domain',
      {
        type: 'check-single-domain',
        domain,
        domainId
      },
      {
        removeOnComplete: 5,
        removeOnFail: 10,
      }
    );

    this.logger.log(`Added single domain check job for: ${domain}`);
  }

  async addUserDomainsCheck(userId: string): Promise<void> {
    await this.domainQueue.add(
      'check-user-domains',
      {
        type: 'check-user-domains',
        userId
      },
      {
        removeOnComplete: 5,
        removeOnFail: 10,
      }
    );

    this.logger.log(`Added user domains check job for user: ${userId}`);
  }

  async addAllDomainsCheck(): Promise<void> {
    await this.domainQueue.add(
      'check-all-domains',
      {
        type: 'check-all-domains'
      },
      {
        removeOnComplete: 3,
        removeOnFail: 10,
      }
    );

    this.logger.log('Added all domains check job');
  }

  async getQueueStats() {
    const waiting = await this.domainQueue.getWaiting();
    const active = await this.domainQueue.getActive();
    const completed = await this.domainQueue.getCompleted();
    const failed = await this.domainQueue.getFailed();
    const repeatableJobs = await this.domainQueue.getRepeatableJobs();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      repeatableJobs: repeatableJobs.length,
      jobs: {
        waiting: waiting.map(job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          createdAt: job.timestamp
        })),
        active: active.map(job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          processedOn: job.processedOn
        })),
        repeatable: repeatableJobs.map(job => ({
          name: job.name,
          cron: job.cron,
          next: job.next
        }))
      }
    };
  }

  async pauseQueue(): Promise<void> {
    await this.domainQueue.pause();
    this.logger.log('Domain monitoring queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.domainQueue.resume();
    this.logger.log('Domain monitoring queue resumed');
  }

  async clearQueue(): Promise<void> {
    await this.domainQueue.empty();
    this.logger.log('Domain monitoring queue cleared');
  }
} 