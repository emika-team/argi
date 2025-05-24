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
    return this.domainService.addDomainToUser(userId, createDomainDto);
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

  // Queue management endpoints
  @Get('queue/stats')
  async getQueueStats() {
    return this.domainQueueService.getQueueStats();
  }

  @Post('queue/check-all')
  async triggerAllDomainsCheck() {
    await this.domainQueueService.addAllDomainsCheck();
    return { success: true, message: 'All domains check job added to queue' };
  }

  @Post('queue/check-user/:userId')
  async triggerUserDomainsCheck(@Param('userId') userId: string) {
    await this.domainQueueService.addUserDomainsCheck(userId);
    return { success: true, message: `User domains check job added to queue for user: ${userId}` };
  }

  @Post('queue/check-domain')
  async triggerSingleDomainCheck(@Body() body: { domain: string; domainId?: string }) {
    const { domain, domainId } = body;
    await this.domainQueueService.addSingleDomainCheck(domain, domainId);
    return { success: true, message: `Single domain check job added to queue for: ${domain}` };
  }

  @Post('queue/pause')
  async pauseQueue() {
    await this.domainQueueService.pauseQueue();
    return { success: true, message: 'Domain monitoring queue paused' };
  }

  @Post('queue/resume')
  async resumeQueue() {
    await this.domainQueueService.resumeQueue();
    return { success: true, message: 'Domain monitoring queue resumed' };
  }

  @Post('queue/clear')
  async clearQueue() {
    await this.domainQueueService.clearQueue();
    return { success: true, message: 'Domain monitoring queue cleared' };
  }
} 