import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ModuleRef } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { DomainProcessorFactory, DomainProcessor } from './domain.processor';

// Base queue name for domain monitoring
export const DOMAIN_MONITORING_QUEUE_PREFIX = 'domain-monitoring';

export interface DomainMonitoringJob {
  type: 'check-domain-expiry';
  domain: string;
  domainId?: string;
}

@Injectable()
export class DomainQueueService implements OnModuleInit {
  private readonly logger = new Logger(DomainQueueService.name);
  private domainQueues: Map<string, Queue<DomainMonitoringJob>> = new Map();

  constructor(
    private moduleRef: ModuleRef,
    private processorFactory: DomainProcessorFactory
  ) {}

  async onModuleInit() {
    this.logger.log('Domain Queue Service initialized');
    // Initialize queues for existing domains if needed
    await this.initializeExistingDomains();
  }

  private async initializeExistingDomains() {
    try {
      // This could be called to setup monitoring for all existing domains
      // For now, we'll just log that the service is ready
      this.logger.log('Ready to setup individual domain monitoring');
    } catch (error) {
      this.logger.error('Error initializing existing domains:', error);
    }
  }

  private getQueueName(domain: string): string {
    // Sanitize domain name for queue name (remove dots and special characters)
    const sanitizedDomain = domain.replace(/[^a-zA-Z0-9]/g, '-');
    return `${DOMAIN_MONITORING_QUEUE_PREFIX}-${sanitizedDomain}`;
  }

  private async getOrCreateDomainQueue(domain: string): Promise<Queue<DomainMonitoringJob>> {
    if (this.domainQueues.has(domain)) {
      return this.domainQueues.get(domain);
    }

    // Create new queue for this domain
    const queueName = this.getQueueName(domain);
    
    try {
      // Dynamically create a new queue
      const Queue = require('bull');
      const queue = new Queue(queueName, {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 50,
        }
      });

      // Setup processor for this queue
      const processor = this.processorFactory.createProcessorForDomain(domain);
      
      // Register job processor
      queue.process('check-domain-expiry', async (job) => {
        return await processor.processJob(job);
      });

      // Store queue reference
      this.domainQueues.set(domain, queue);
      
      this.logger.log(`Created new queue for domain: ${domain} (queue: ${queueName})`);
      return queue;
    } catch (error) {
      this.logger.error(`Failed to create queue for domain ${domain}:`, error);
      throw error;
    }
  }

  async setupDomainMonitoring(domain: string, domainId?: string, intervalMinutes: number = 60): Promise<void> {
    try {
      const queue = await this.getOrCreateDomainQueue(domain);

      // Remove existing repeatable jobs for this domain
      const repeatableJobs = await queue.getRepeatableJobs();
      for (const job of repeatableJobs) {
        if (job.name === 'check-domain-expiry') {
          await queue.removeRepeatableByKey(job.key);
        }
      }

      // Add new repeatable job for this specific domain
      await queue.add(
        'check-domain-expiry',
        { 
          type: 'check-domain-expiry',
          domain,
          domainId
        },
        {
          repeat: { 
            cron: `*/${intervalMinutes} * * * *` // Every N minutes
          },
          removeOnComplete: 10,
          removeOnFail: 50,
        }
      );

      this.logger.log(`Domain monitoring scheduled for ${domain} every ${intervalMinutes} minutes`);
    } catch (error) {
      this.logger.error(`Failed to setup domain monitoring for ${domain}:`, error);
      throw error;
    }
  }

  async addSingleDomainCheck(domain: string, domainId?: string): Promise<void> {
    try {
      const queue = await this.getOrCreateDomainQueue(domain);
      
      await queue.add(
        'check-domain-expiry',
        {
          type: 'check-domain-expiry',
          domain,
          domainId
        },
        {
          removeOnComplete: 5,
          removeOnFail: 10,
        }
      );

      this.logger.log(`Added single domain check job for: ${domain}`);
    } catch (error) {
      this.logger.error(`Failed to add single check for domain ${domain}:`, error);
      throw error;
    }
  }

  async removeDomainMonitoring(domain: string): Promise<void> {
    try {
      const queue = this.domainQueues.get(domain);
      if (!queue) {
        this.logger.warn(`No queue found for domain: ${domain}`);
        return;
      }

      // Remove all repeatable jobs
      const repeatableJobs = await queue.getRepeatableJobs();
      for (const job of repeatableJobs) {
        await queue.removeRepeatableByKey(job.key);
      }

      // Clear the queue
      await queue.empty();

      // Close the queue
      await queue.close();

      // Remove processor
      this.processorFactory.removeProcessor(domain);

      // Remove from our map
      this.domainQueues.delete(domain);

      this.logger.log(`Removed monitoring for domain: ${domain}`);
    } catch (error) {
      this.logger.error(`Failed to remove monitoring for domain ${domain}:`, error);
      throw error;
    }
  }

  async getDomainQueueStats(domain: string) {
    const queue = this.domainQueues.get(domain);
    if (!queue) {
      return null;
    }

    try {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();
      const repeatableJobs = await queue.getRepeatableJobs();

      return {
        domain,
        queueName: this.getQueueName(domain),
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
    } catch (error) {
      this.logger.error(`Failed to get stats for domain ${domain}:`, error);
      return null;
    }
  }

  async getAllDomainsStats() {
    const stats = [];
    
    for (const [domain] of this.domainQueues) {
      const domainStats = await this.getDomainQueueStats(domain);
      if (domainStats) {
        stats.push(domainStats);
      }
    }

    return {
      totalDomains: this.domainQueues.size,
      domains: stats
    };
  }

  async pauseDomainQueue(domain: string): Promise<void> {
    const queue = this.domainQueues.get(domain);
    if (queue) {
      await queue.pause();
      this.logger.log(`Domain queue paused for: ${domain}`);
    }
  }

  async resumeDomainQueue(domain: string): Promise<void> {
    const queue = this.domainQueues.get(domain);
    if (queue) {
      await queue.resume();
      this.logger.log(`Domain queue resumed for: ${domain}`);
    }
  }

  async clearDomainQueue(domain: string): Promise<void> {
    const queue = this.domainQueues.get(domain);
    if (queue) {
      await queue.empty();
      this.logger.log(`Domain queue cleared for: ${domain}`);
    }
  }

  // Method to setup monitoring for all user domains
  async setupUserDomainsMonitoring(domains: { domain: string; domainId: string }[]): Promise<void> {
    for (const { domain, domainId } of domains) {
      await this.setupDomainMonitoring(domain, domainId);
    }
  }

  // Get all active domain queues
  getActiveDomains(): string[] {
    return Array.from(this.domainQueues.keys());
  }

  // Check if domain has active queue
  hasDomainQueue(domain: string): boolean {
    return this.domainQueues.has(domain);
  }

  // Cleanup method for closing all queues
  async onModuleDestroy() {
    this.logger.log('Closing all domain queues...');
    
    for (const [domain, queue] of this.domainQueues) {
      try {
        await queue.close();
        this.logger.log(`Closed queue for domain: ${domain}`);
      } catch (error) {
        this.logger.error(`Error closing queue for domain ${domain}:`, error);
      }
    }
    
    this.domainQueues.clear();
  }
} 