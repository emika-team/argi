import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete, 
  Param, 
  Query, 
  Body,
  UseGuards,
  Request
} from '@nestjs/common';
import { DomainService } from './domain.service';
import { DomainQueueService } from './domain-queue.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';

interface AddDomainRequest {
  domain: string;
  userId?: string;
}

@Controller('domain')
export class DomainController {
  constructor(
    private readonly domainService: DomainService,
    private readonly domainQueueService: DomainQueueService
  ) {}

  @Get('check/:domain')
  checkDomain(@Param('domain') domain: string) {
    return this.domainService.checkDomainExpiry(domain);
  }

  @Get('check-multiple')
  checkMultiple(@Query('domains') domains: string) {
    const domainArray = domains.split(',').map(d => d.trim());
    return this.domainService.checkMultipleDomains(domainArray);
  }

  // Legacy endpoints for backward compatibility
  @Get('list/:userId')
  async getUserDomains(@Param('userId') userId: string) {
    return this.domainService.getUserDomains(userId);
  }

  @Post('add')
  async addDomain(@Body() addDomainRequest: AddDomainRequest) {
    const { domain, userId = 'default' } = addDomainRequest;
    return this.domainService.addDomainToUserLegacy(domain, userId);
  }

  @Delete(':userId/:domain')
  async removeDomain(
    @Param('userId') userId: string,
    @Param('domain') domain: string
  ) {
    return this.domainService.removeDomainFromUserLegacy(domain, userId);
  }

  @Get('list-with-status/:userId')
  async getUserDomainsWithStatus(@Param('userId') userId: string) {
    return this.domainService.getUserDomainsWithStatus(userId);
  }

  // New endpoints with improved functionality
  @Get('user/:userId/domains')
  async getUserDomainsDetailed(@Param('userId') userId: string) {
    return this.domainService.getUserDomainsDetailed(userId);
  }

  @Post('user/:userId/domains')
  async createDomain(
    @Param('userId') userId: string,
    @Body() createDomainDto: CreateDomainDto
  ) {
    const domain = await this.domainService.addDomainToUser(userId, createDomainDto);
    
    // Setup individual queue monitoring for this domain
    try {
      await this.domainQueueService.setupDomainMonitoring(
        domain.domain, 
        domain._id.toString(),
        60 // Check every 60 minutes
      );
    } catch (error) {
      console.error(`Failed to setup monitoring for domain ${domain.domain}:`, error);
    }
    
    return domain;
  }

  @Put('user/:userId/domains/:domain')
  async updateDomain(
    @Param('userId') userId: string,
    @Param('domain') domain: string,
    @Body() updateDomainDto: UpdateDomainDto
  ) {
    return this.domainService.updateDomain(userId, domain, updateDomainDto);
  }

  @Delete('user/:userId/domains/:domain')
  async deleteDomain(
    @Param('userId') userId: string,
    @Param('domain') domain: string
  ) {
    await this.domainService.removeDomainFromUser(userId, domain);
    
    // Remove queue monitoring for this domain
    try {
      await this.domainQueueService.removeDomainMonitoring(domain.toLowerCase());
    } catch (error) {
      console.error(`Failed to remove monitoring for domain ${domain}:`, error);
    }
    
    return { success: true, message: 'Domain deleted successfully' };
  }

  @Get('expiring')
  async getExpiringDomains(@Query('days') days?: string) {
    const daysThreshold = days ? parseInt(days, 10) : 30;
    return this.domainService.getExpiringDomains(daysThreshold);
  }

  @Get('user/:userId/domains/:domain/check')
  async checkAndUpdateDomain(
    @Param('userId') userId: string,
    @Param('domain') domain: string
  ) {
    const result = await this.domainService.checkDomainExpiry(domain);
    
    // Find the domain document to update its status
    const domainDoc = await this.domainService.getUserDomainsDetailed(userId);
    const targetDomain = domainDoc.find(d => d.domain === domain.toLowerCase());
    
    if (targetDomain) {
      await this.domainService.updateDomainStatus(targetDomain._id.toString(), result);
    }
    
    return result;
  }

  // Updated queue management endpoints
  @Get('queue/stats')
  async getQueueStats() {
    return this.domainQueueService.getAllDomainsStats();
  }

  @Get('queue/stats/:domain')
  async getDomainQueueStats(@Param('domain') domain: string) {
    return this.domainQueueService.getDomainQueueStats(domain);
  }

  @Post('queue/check-domain')
  async triggerSingleDomainCheck(@Body() body: { domain: string; domainId?: string }) {
    const { domain, domainId } = body;
    await this.domainQueueService.addSingleDomainCheck(domain, domainId);
    return { success: true, message: `Single domain check job added to queue for: ${domain}` };
  }

  @Post('queue/setup-user-monitoring/:userId')
  async setupUserDomainsMonitoring(@Param('userId') userId: string) {
    const userDomains = await this.domainService.getUserDomainsDetailed(userId);
    const domainData = userDomains.map(d => ({
      domain: d.domain,
      domainId: d._id.toString()
    }));
    
    await this.domainQueueService.setupUserDomainsMonitoring(domainData);
    return { 
      success: true, 
      message: `Setup monitoring for ${domainData.length} domains for user: ${userId}`,
      domains: domainData.map(d => d.domain)
    };
  }

  @Post('queue/pause/:domain')
  async pauseDomainQueue(@Param('domain') domain: string) {
    await this.domainQueueService.pauseDomainQueue(domain);
    return { success: true, message: `Domain queue paused for: ${domain}` };
  }

  @Post('queue/resume/:domain')
  async resumeDomainQueue(@Param('domain') domain: string) {
    await this.domainQueueService.resumeDomainQueue(domain);
    return { success: true, message: `Domain queue resumed for: ${domain}` };
  }

  @Post('queue/clear/:domain')
  async clearDomainQueue(@Param('domain') domain: string) {
    await this.domainQueueService.clearDomainQueue(domain);
    return { success: true, message: `Domain queue cleared for: ${domain}` };
  }

  @Delete('queue/remove/:domain')
  async removeDomainQueue(@Param('domain') domain: string) {
    await this.domainQueueService.removeDomainMonitoring(domain);
    return { success: true, message: `Monitoring removed for domain: ${domain}` };
  }

  @Get('queue/active-domains')
  async getActiveDomains() {
    const domains = this.domainQueueService.getActiveDomains();
    return { 
      success: true, 
      totalDomains: domains.length,
      domains 
    };
  }
} 