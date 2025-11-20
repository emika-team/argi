import { 
  Controller, 
  Post, 
  Get, 
  Delete,
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

  // New endpoints for managing stored Cloudflare credentials
  @Post('cloudflare/credentials/:userId')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async saveCloudflareCredentials(
    @Param('userId') userId: string,
    @Body() credentials: CloudflareCredentialsDto
  ) {
    const saved = await this.integrationsService.saveCloudflareCredentials(userId, credentials);
    return {
      success: true,
      message: 'Cloudflare credentials saved successfully',
      data: {
        userId: saved.userId,
        email: saved.email,
        lastValidatedAt: saved.lastValidatedAt,
        isActive: saved.isActive,
      },
    };
  }

  @Get('cloudflare/credentials/:userId')
  async getCloudflareCredentials(@Param('userId') userId: string) {
    const credentials = await this.integrationsService.getCloudflareCredentials(userId);
    return {
      success: true,
      data: {
        userId: credentials.userId,
        email: credentials.email,
        lastValidatedAt: credentials.lastValidatedAt,
        isActive: credentials.isActive,
        hasCredentials: true,
      },
    };
  }

  @Delete('cloudflare/credentials/:userId')
  @HttpCode(HttpStatus.OK)
  async deleteCloudflareCredentials(@Param('userId') userId: string) {
    await this.integrationsService.deleteCloudflareCredentials(userId);
    return {
      success: true,
      message: 'Cloudflare credentials deleted successfully',
    };
  }

  @Get('cloudflare/credentials/:userId/status')
  async checkCloudflareCredentialsStatus(@Param('userId') userId: string) {
    const hasCredentials = await this.integrationsService.hasCloudflareCredentials(userId);
    return {
      success: true,
      data: {
        hasCredentials,
      },
    };
  }

  @Post('cloudflare/import-with-stored/:userId')
  @HttpCode(HttpStatus.OK)
  async importWithStoredCredentials(@Param('userId') userId: string) {
    const result = await this.integrationsService.importDomainsWithStoredCredentials(userId);
    return {
      success: true,
      data: result,
    };
  }
} 