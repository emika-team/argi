import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as whois from 'whois';

import { Domain, DomainDocument } from './schemas/domain.schema';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';

export interface DomainResult {
  domain: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  error?: string;
}

@Injectable()
export class DomainService {
  private readonly logger = new Logger('DomainService');

  constructor(
    @InjectModel(Domain.name) private domainModel: Model<DomainDocument>,
  ) {}

  private isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async checkDomainExpiry(domain: string): Promise<DomainResult> {
    return new Promise((resolve, reject) => {
      whois.lookup(domain, (err, data) => {
        if (err) {
          resolve({
            domain,
            error: 'Failed to lookup domain information',
          });
          return;
        }

        this.logger.debug(`checkDomainExpiry: ${domain}`);

        try {
          const expiryMatch = data.match(/Registry Expiry Date:\s*(.+)/i) ||
                             data.match(/Expiry Date:\s*(.+)/i) ||
                             data.match(/Expiration Date:\s*(.+)/i);

          if (expiryMatch) {
            const expiryDate = new Date(expiryMatch[1].trim());
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            resolve({
              domain,
              expiryDate: expiryDate.toISOString(),
              daysUntilExpiry,
              isExpired: daysUntilExpiry < 0,
              isExpiringSoon: daysUntilExpiry <= 30,
            });
          } else {
            resolve({
              domain,
              error: 'Could not parse expiry date',
            });
          }
        } catch (parseError) {
          resolve({
            domain,
            error: 'Error parsing domain information',
          });
        }
      });
    });
  }

  async checkMultipleDomains(domains: string[]): Promise<DomainResult[]> {
    const results = await Promise.allSettled(
      domains.map(domain => this.checkDomainExpiry(domain))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          domain: domains[index],
          error: 'Failed to check domain',
        };
      }
    });
  }

  async getUserDomains(userId: string): Promise<string[]> {
    if (!this.isValidObjectId(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const domains = await this.domainModel
      .find({ userId, isActive: true })
      .select('domain')
      .lean();
    
    return domains.map(d => d.domain);
  }

  async addDomainToUser(userId: string, createDomainDto: CreateDomainDto): Promise<DomainDocument> {
    if (!this.isValidObjectId(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const cleanDomain = createDomainDto.domain.trim().toLowerCase();
    
    if (!cleanDomain) {
      throw new ConflictException('Domain cannot be empty');
    }

    // Check if domain already exists for this user
    const existingDomain = await this.domainModel.findOne({ 
      userId, 
      domain: cleanDomain 
    });

    if (existingDomain) {
      throw new ConflictException('Domain already exists for this user');
    }

    const domain = new this.domainModel({
      ...createDomainDto,
      domain: cleanDomain,
      userId,
    });

    return domain.save();
  }

  async removeDomainFromUser(userId: string, domain: string): Promise<void> {
    if (!this.isValidObjectId(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const result = await this.domainModel.deleteOne({ 
      userId, 
      domain: domain.toLowerCase() 
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Domain not found');
    }
  }

  async updateDomain(userId: string, domain: string, updateDomainDto: UpdateDomainDto): Promise<DomainDocument> {
    if (!this.isValidObjectId(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const updatedDomain = await this.domainModel.findOneAndUpdate(
      { userId, domain: domain.toLowerCase() },
      updateDomainDto,
      { new: true }
    );

    if (!updatedDomain) {
      throw new NotFoundException('Domain not found');
    }

    return updatedDomain;
  }

  async getUserDomainsWithStatus(userId: string): Promise<DomainResult[]> {
    const domains = await this.getUserDomains(userId);
    if (domains.length === 0) {
      return [];
    }
    return this.checkMultipleDomains(domains);
  }

  async getUserDomainsDetailed(userId: string): Promise<DomainDocument[]> {
    if (!this.isValidObjectId(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    return this.domainModel.find({ userId, isActive: true }).exec();
  }

  async updateDomainStatus(domainId: string, result: DomainResult): Promise<void> {
    if (!this.isValidObjectId(domainId)) {
      throw new BadRequestException('Invalid domain ID format');
    }

    if (result.error) {
      this.logger.error(`Error checking domain ${domainId}: ${result.error}`);
      return;
    }

    const updateData: any = {
      lastCheckedAt: new Date(),
    };

    if (result.error) {
      updateData.lastError = result.error;
    } else {
      updateData.lastError = null;
      if (result.expiryDate) {
        updateData.lastExpiryDate = new Date(result.expiryDate);
      }
      if (result.daysUntilExpiry !== undefined) {
        updateData.lastDaysUntilExpiry = result.daysUntilExpiry;
      }
      updateData.isExpired = result.isExpired || false;
      updateData.isExpiringSoon = result.isExpiringSoon || false;
    }

    await this.domainModel.findByIdAndUpdate(domainId, updateData);
  }

  async getExpiringDomains(daysThreshold: number = 30): Promise<DomainDocument[]> {
    return this.domainModel.find({
      isActive: true,
      enableExpiryAlerts: true,
      $or: [
        { isExpiringSoon: true },
        { lastDaysUntilExpiry: { $lte: daysThreshold, $gte: 0 } }
      ]
    }).populate('userId').exec();
  }

  async getAllActiveDomains(): Promise<DomainDocument[]> {
    return this.domainModel.find({ isActive: true }).exec();
  }

  // Backward compatibility methods for existing API
  async addDomainToUserLegacy(domain: string, userId: string): Promise<{ success: boolean; message: string; domain?: string }> {
    try {
      // Handle legacy "default" userId by returning error message
      if (userId === 'default' || !this.isValidObjectId(userId)) {
        return {
          success: false,
          message: 'Please provide a valid user ID. Legacy "default" user is no longer supported.'
        };
      }

      const cleanDomain = domain.trim().toLowerCase();
      const createDomainDto: CreateDomainDto = { domain: cleanDomain };
      const newDomain = await this.addDomainToUser(userId, createDomainDto);
      
      return {
        success: true,
        message: 'Domain added successfully',
        domain: newDomain.domain
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to add domain'
      };
    }
  }

  async removeDomainFromUserLegacy(domain: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Handle legacy "default" userId by returning error message
      if (userId === 'default' || !this.isValidObjectId(userId)) {
        return {
          success: false,
          message: 'Please provide a valid user ID. Legacy "default" user is no longer supported.'
        };
      }

      await this.removeDomainFromUser(userId, domain);
      return {
        success: true,
        message: 'Domain removed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to remove domain'
      };
    }
  }
} 