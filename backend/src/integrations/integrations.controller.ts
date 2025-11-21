import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  Query,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IntegrationsService } from './integrations.service';
import { ImportDomainsDto, CloudflareCredentialsDto } from './dto/import-domains.dto';

@Controller('integrations')
@UseGuards(ThrottlerGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('cloudflare/validate')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async validateCloudflareCredentials(@Body() credentials: CloudflareCredentialsDto) {
    return this.integrationsService.validateCloudflareCredentials(credentials);
  }

  @Post('cloudflare/zones')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getCloudflareZones(@Body() credentials: CloudflareCredentialsDto) {
    const zones = await this.integrationsService.getCloudflareZones(credentials);
    return {
      success: true,
      data: zones,
      count: zones.length,
    };
  }

  @Post('cloudflare/import')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async importFromCloudflare(@Body() importDto: ImportDomainsDto) {
    const result = await this.integrationsService.importDomainsFromCloudflare(importDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('summary/:userId')
  async getProviderSummary(@Param('userId') userId: string) {
    const summary = await this.integrationsService.getProviderSummary(userId);
    return {
      success: true,
      data: summary,
    };
  }

  @Get('cloudflare/test')
  async testCloudflareConnection() {
    return {
      success: true,
      message: 'Cloudflare integration is available',
      provider: 'cloudflare',
      version: '1.0.0',
    };
  }

  @Get('cloudflare/zones/:userId')
  async getZonesForUser(@Param('userId') userId: string) {
    const zones = await this.integrationsService.getCloudflareZonesForUser(userId);
    return {
      success: true,
      data: zones,
      count: zones.length,
    };
  }
} 