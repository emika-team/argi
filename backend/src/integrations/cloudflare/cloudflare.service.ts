import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CloudflareCredentialsDto, CloudflareDomainInfo } from '../dto/import-domains.dto';

export interface CloudflareApiResponse<T> {
  success: boolean;
  errors: any[];
  messages: any[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    count: number;
    total_count: number;
  };
}

@Injectable()
export class CloudflareService {
  private readonly logger = new Logger(CloudflareService.name);
  private axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.axiosInstance = axios.create({
      baseURL: 'https://api.cloudflare.com/client/v4',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private setCredentials(email: string | undefined, apiKey: string) {
    // Check if apiKey looks like an API Token
    // API Tokens don't require email and use Bearer authentication
    // Global API Keys are typically 37 characters, API Tokens are 40+ characters
    const isApiToken = !email || email.trim() === '' || apiKey.length >= 40;
    
    if (isApiToken) {
      // Use API Token authentication
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
      delete this.axiosInstance.defaults.headers.common['X-Auth-Email'];
      delete this.axiosInstance.defaults.headers.common['X-Auth-Key'];
      this.logger.debug(`Using API Token authentication (token length: ${apiKey.length})`);
    } else {
      // Use Global API Key authentication
      this.axiosInstance.defaults.headers.common['X-Auth-Email'] = email;
      this.axiosInstance.defaults.headers.common['X-Auth-Key'] = apiKey;
      delete this.axiosInstance.defaults.headers.common['Authorization'];
      this.logger.debug('Using Global API Key authentication');
    }
  }

  async validateCredentials(credentials: CloudflareCredentialsDto): Promise<boolean> {
    try {
      this.setCredentials(credentials.email, credentials.apiKey);
      
      // Use /user/tokens/verify for API tokens, /user for Global API Key
      const isApiToken = !credentials.email || credentials.email.trim() === '' || credentials.apiKey.length >= 40;
      const endpoint = isApiToken ? '/user/tokens/verify' : '/user';
      
      this.logger.debug(`Validating credentials using endpoint: ${endpoint}`);
      
      const response = await this.axiosInstance.get<CloudflareApiResponse<any>>(endpoint);
      
      if (!response.data.success) {
        this.logger.error('Cloudflare API validation failed', JSON.stringify(response.data.errors));
        return false;
      }

      this.logger.log('Cloudflare credentials validated successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to validate Cloudflare credentials', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return false;
    }
  }

  async getUserInfo(credentials: CloudflareCredentialsDto) {
    try {
      this.setCredentials(credentials.email, credentials.apiKey);
      
      // For API tokens, use the verify endpoint to get token info
      const isApiToken = !credentials.email || credentials.email.trim() === '' || credentials.apiKey.length >= 40;
      const endpoint = isApiToken ? '/user/tokens/verify' : '/user';
      
      const response = await this.axiosInstance.get<CloudflareApiResponse<any>>(endpoint);
      
      if (!response.data.success) {
        throw new UnauthorizedException('Invalid Cloudflare credentials');
      }

      return response.data.result;
    } catch (error) {
      this.logger.error('Failed to get Cloudflare user info', error.message);
      throw new BadRequestException('Failed to connect to Cloudflare API');
    }
  }

  async getZones(credentials: CloudflareCredentialsDto): Promise<CloudflareDomainInfo[]> {
    try {
      this.setCredentials(credentials.email, credentials.apiKey);
      
      let allZones: CloudflareDomainInfo[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.axiosInstance.get<CloudflareApiResponse<CloudflareDomainInfo[]>>(
          `/zones?page=${page}&per_page=50`
        );

        if (!response.data.success) {
          this.logger.error('Failed to fetch zones from Cloudflare', response.data.errors);
          throw new BadRequestException('Failed to fetch domains from Cloudflare');
        }

        allZones.push(...response.data.result);

        // Check if there are more pages
        const resultInfo = response.data.result_info;
        if (resultInfo) {
          hasMore = page < Math.ceil(resultInfo.total_count / resultInfo.per_page);
          page++;
        } else {
          hasMore = false;
        }
      }

      this.logger.log(`Successfully fetched ${allZones.length} zones from Cloudflare`);
      return allZones;
    } catch (error) {
      this.logger.error('Failed to fetch zones from Cloudflare', error.message);
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to connect to Cloudflare API');
    }
  }

  async getZoneDetails(credentials: CloudflareCredentialsDto, zoneId: string): Promise<CloudflareDomainInfo> {
    try {
      this.setCredentials(credentials.email, credentials.apiKey);
      
      const response = await this.axiosInstance.get<CloudflareApiResponse<CloudflareDomainInfo>>(
        `/zones/${zoneId}`
      );

      if (!response.data.success) {
        this.logger.error('Failed to fetch zone details from Cloudflare', response.data.errors);
        throw new BadRequestException('Failed to fetch domain details from Cloudflare');
      }

      return response.data.result;
    } catch (error) {
      this.logger.error('Failed to fetch zone details from Cloudflare', error.message);
      throw new BadRequestException('Failed to connect to Cloudflare API');
    }
  }

  formatDomainForImport(zone: CloudflareDomainInfo) {
    return {
      domain: zone.name,
      provider: 'cloudflare',
      providerId: zone.id,
      status: zone.status,
      isPaused: zone.paused,
      nameServers: zone.name_servers,
      originalNameServers: zone.original_name_servers,
      originalRegistrar: zone.original_registrar,
      createdAt: new Date(zone.created_on),
      modifiedAt: new Date(zone.modified_on),
      activatedAt: zone.activated_on ? new Date(zone.activated_on) : null,
    };
  }
} 