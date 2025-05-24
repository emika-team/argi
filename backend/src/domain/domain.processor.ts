import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DomainService } from './domain.service';

export const DOMAIN_QUEUE = 'domain-monitoring';

export interface DomainMonitoringJob {
  type: 'check-single-domain' | 'check-all-domains' | 'check-user-domains';
  domainId?: string;
  userId?: string;
  domain?: string;
}

@Processor(DOMAIN_QUEUE)
export class DomainProcessor {
  private readonly logger = new Logger(DomainProcessor.name);

  constructor(private readonly domainService: DomainService) {}

  @Process('check-single-domain')
  async handleSingleDomainCheck(job: Job<DomainMonitoringJob>) {
    const { domainId, domain } = job.data;
    
    this.logger.log(`Processing single domain check for: ${domain || domainId}`);

    try {
      if (!domain) {
        this.logger.warn(`No domain provided for job ${job.id}`);
        return;
      }

      const result = await this.domainService.checkDomainExpiry(domain);
      
      if (domainId) {
        await this.domainService.updateDomainStatus(domainId, result);
      }

      this.logger.log(`Completed domain check for: ${domain}`, result);
      return result;
    } catch (error) {
      this.logger.error(`Error checking domain ${domain}:`, error);
      throw error;
    }
  }

  @Process('check-user-domains')
  async handleUserDomainsCheck(job: Job<DomainMonitoringJob>) {
    const { userId } = job.data;
    
    this.logger.log(`Processing user domains check for user: ${userId}`);

    try {
      const userDomains = await this.domainService.getUserDomainsDetailed(userId);
      
      if (userDomains.length === 0) {
        this.logger.log(`No domains found for user: ${userId}`);
        return [];
      }

      const results = [];
      
      for (const domainDoc of userDomains) {
        try {
          const result = await this.domainService.checkDomainExpiry(domainDoc.domain);
          await this.domainService.updateDomainStatus(domainDoc._id.toString(), result);
          results.push(result);
          
          this.logger.debug(`Checked domain: ${domainDoc.domain}`, result);
        } catch (error) {
          this.logger.error(`Error checking domain ${domainDoc.domain}:`, error);
          results.push({
            domain: domainDoc.domain,
            error: error.message || 'Failed to check domain'
          });
        }
      }

      this.logger.log(`Completed user domains check for user: ${userId}. Checked ${results.length} domains`);
      return results;
    } catch (error) {
      this.logger.error(`Error checking user domains for ${userId}:`, error);
      throw error;
    }
  }

  @Process('check-all-domains')
  async handleAllDomainsCheck(job: Job<DomainMonitoringJob>) {
    this.logger.log('Processing all domains check...');

    try {
      // Get all active domains from database
      const allDomains = await this.domainService.getAllActiveDomains();
      
      if (allDomains.length === 0) {
        this.logger.log('No active domains found');
        return [];
      }

      this.logger.log(`Found ${allDomains.length} active domains to check`);

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const domainDoc of allDomains) {
        try {
          const result = await this.domainService.checkDomainExpiry(domainDoc.domain);
          await this.domainService.updateDomainStatus(domainDoc._id.toString(), result);
          results.push(result);
          successCount++;
          
          if (result.isExpiringSoon || result.isExpired) {
            this.logger.warn(`Domain alert: ${domainDoc.domain} - ${result.daysUntilExpiry} days until expiry`);
          }
        } catch (error) {
          this.logger.error(`Error checking domain ${domainDoc.domain}:`, error);
          errorCount++;
          results.push({
            domain: domainDoc.domain,
            error: error.message || 'Failed to check domain'
          });
        }

        // Add small delay between checks to avoid overwhelming external services
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.logger.log(`Completed all domains check. Success: ${successCount}, Errors: ${errorCount}`);
      return results;
    } catch (error) {
      this.logger.error('Error in all domains check:', error);
      throw error;
    }
  }
} 