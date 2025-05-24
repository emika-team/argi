import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { CloudflareService } from './cloudflare/cloudflare.service';
import { DomainModule } from '../domain/domain.module';

@Module({
  imports: [
    ConfigModule,
    DomainModule,
  ],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    CloudflareService,
  ],
  exports: [
    IntegrationsService,
    CloudflareService,
  ],
})
export class IntegrationsModule {} 