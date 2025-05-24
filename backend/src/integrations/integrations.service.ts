import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CloudflareService } from './cloudflare/cloudflare.service';
import { DomainService } from '../domain/domain.service';
import { ImportDomainsDto, CloudflareCredentialsDto } from './dto/import-domains.dto';

export interface ImportResult {
  success: boolean;
  totalDomains: number;
  importedDomains: number;
  skippedDomains: number;
  errors: string[];
  importedDomainsList: string[];
  skippedDomainsList: Array<{ domain: string; reason: string }>;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private cloudflareService: CloudflareService,
    private domainService: DomainService,
  ) {}

  async validateCloudflareCredentials(credentials: CloudflareCredentialsDto): Promise<{ valid: boolean; userInfo?: any }> {
    const isValid = await this.cloudflareService.validateCredentials(credentials);
    
    if (!isValid) {
      return { valid: false };
    }

    try {
      const userInfo = await this.cloudflareService.getUserInfo(credentials);
      return { valid: true, userInfo };
    } catch (error) {
      return { valid: false };
    }
  }

  async getCloudflareZones(credentials: CloudflareCredentialsDto) {
    const isValid = await this.cloudflareService.validateCredentials(credentials);
    if (!isValid) {
      throw new BadRequestException('Invalid Cloudflare credentials');
    }

    const zones = await this.cloudflareService.getZones(credentials);
    return zones.map(zone => this.cloudflareService.formatDomainForImport(zone));
  }

  async importDomainsFromCloudflare(importDto: ImportDomainsDto): Promise<ImportResult> {
    const credentials: CloudflareCredentialsDto = {
      email: importDto.email,
      apiKey: importDto.apiKey,
    };

    // Validate credentials first
    const validation = await this.validateCloudflareCredentials(credentials);
    if (!validation.valid) {
      throw new BadRequestException('Invalid Cloudflare credentials');
    }

    // Get zones from Cloudflare
    const zones = await this.cloudflareService.getZones(credentials);
    
    const result: ImportResult = {
      success: true,
      totalDomains: zones.length,
      importedDomains: 0,
      skippedDomains: 0,
      errors: [],
      importedDomainsList: [],
      skippedDomainsList: [],
    };

    // Get existing user domains
    const existingDomains = await this.domainService.getUserDomains(importDto.userId);
    const existingDomainsSet = new Set(existingDomains.map(d => d.toLowerCase()));

    for (const zone of zones) {
      try {
        const domainName = zone.name.toLowerCase();

        // Skip if domain already exists
        if (existingDomainsSet.has(domainName)) {
          result.skippedDomains++;
          result.skippedDomainsList.push({
            domain: domainName,
            reason: 'Domain already exists',
          });
          continue;
        }

        // Create domain entry
        const createDomainDto = {
          domain: domainName,
          provider: 'cloudflare',
          providerId: zone.id,
          enableExpiryAlerts: true,
          isActive: true,
        };

        await this.domainService.addDomainToUser(importDto.userId, createDomainDto);
        
        result.importedDomains++;
        result.importedDomainsList.push(domainName);

        this.logger.log(`Successfully imported domain: ${domainName}`);
      } catch (error) {
        this.logger.error(`Failed to import domain ${zone.name}:`, error.message);
        result.errors.push(`${zone.name}: ${error.message}`);
        result.skippedDomains++;
        result.skippedDomainsList.push({
          domain: zone.name,
          reason: error.message,
        });
      }
    }

    // Log summary
    this.logger.log(`Import completed - Total: ${result.totalDomains}, Imported: ${result.importedDomains}, Skipped: ${result.skippedDomains}`);

    return result;
  }

  async getProviderSummary(userId: string) {
    const domains = await this.domainService.getUserDomainsDetailed(userId);
    
    const summary = {
      total: domains.length,
      byProvider: {
        cloudflare: 0,
        manual: 0,
        other: 0,
      },
    };

    domains.forEach(domain => {
      const provider = (domain as any).provider || 'manual';
      if (provider === 'cloudflare') {
        summary.byProvider.cloudflare++;
      } else if (provider === 'manual') {
        summary.byProvider.manual++;
      } else {
        summary.byProvider.other++;
      }
    });

    return summary;
  }
} 