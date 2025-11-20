import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudflareService } from './cloudflare/cloudflare.service';
import { DomainService } from '../domain/domain.service';
import { ImportDomainsDto, CloudflareCredentialsDto } from './dto/import-domains.dto';
import { CloudflareCredentials, CloudflareCredentialsDocument } from './schemas/cloudflare-credentials.schema';

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
    @InjectModel(CloudflareCredentials.name) private cloudflareCredentialsModel: Model<CloudflareCredentialsDocument>,
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

  // Cloudflare credentials management methods
  async saveCloudflareCredentials(userId: string, credentials: CloudflareCredentialsDto): Promise<CloudflareCredentialsDocument> {
    try {
      // Validate credentials first
      const validation = await this.validateCloudflareCredentials(credentials);
      if (!validation.valid) {
        throw new BadRequestException('Invalid Cloudflare credentials');
      }

      // Check if credentials already exist for this user
      const existing = await this.cloudflareCredentialsModel.findOne({ userId });

      const credentialsData = {
        userId,
        email: credentials.email,
        apiKey: credentials.apiKey,
        isActive: true,
        lastValidatedAt: new Date(),
        lastError: null,
        metadata: validation.userInfo,
      };

      if (existing) {
        // Update existing credentials
        Object.assign(existing, credentialsData);
        await existing.save();
        this.logger.log(`Updated Cloudflare credentials for user ${userId}`);
        return existing;
      } else {
        // Create new credentials
        const newCredentials = new this.cloudflareCredentialsModel(credentialsData);
        await newCredentials.save();
        this.logger.log(`Saved new Cloudflare credentials for user ${userId}`);
        return newCredentials;
      }
    } catch (error) {
      this.logger.error(`Failed to save Cloudflare credentials for user ${userId}:`, error.message);
      throw error;
    }
  }

  async getCloudflareCredentials(userId: string): Promise<CloudflareCredentialsDocument> {
    const credentials = await this.cloudflareCredentialsModel.findOne({ userId, isActive: true });
    
    if (!credentials) {
      throw new NotFoundException('Cloudflare credentials not found for this user');
    }

    return credentials;
  }

  async deleteCloudflareCredentials(userId: string): Promise<void> {
    const result = await this.cloudflareCredentialsModel.deleteOne({ userId });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('Cloudflare credentials not found for this user');
    }

    this.logger.log(`Deleted Cloudflare credentials for user ${userId}`);
  }

  async hasCloudflareCredentials(userId: string): Promise<boolean> {
    const count = await this.cloudflareCredentialsModel.countDocuments({ userId, isActive: true });
    return count > 0;
  }

  // Updated import method to use stored credentials
  async importDomainsWithStoredCredentials(userId: string): Promise<ImportResult> {
    try {
      // Get stored credentials
      const storedCredentials = await this.getCloudflareCredentials(userId);

      const credentials: CloudflareCredentialsDto = {
        email: storedCredentials.email,
        apiKey: storedCredentials.apiKey,
      };

      // Validate that credentials are still valid
      const validation = await this.validateCloudflareCredentials(credentials);
      if (!validation.valid) {
        // Update last error
        storedCredentials.lastError = 'Credentials no longer valid';
        await storedCredentials.save();
        throw new BadRequestException('Stored Cloudflare credentials are no longer valid. Please update them.');
      }

      // Update last validated time
      storedCredentials.lastValidatedAt = new Date();
      storedCredentials.lastError = null;
      await storedCredentials.save();

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
      const existingDomains = await this.domainService.getUserDomains(userId);
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

          await this.domainService.addDomainToUser(userId, createDomainDto);
          
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
    } catch (error) {
      this.logger.error(`Failed to import domains with stored credentials for user ${userId}:`, error.message);
      throw error;
    }
  }
} 