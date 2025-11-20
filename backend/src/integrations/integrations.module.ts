import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { CloudflareService } from './cloudflare/cloudflare.service';
import { DomainModule } from '../domain/domain.module';
import { CloudflareCredentials, CloudflareCredentialsSchema } from './schemas/cloudflare-credentials.schema';

@Module({
  imports: [
    ConfigModule,
    DomainModule,
    MongooseModule.forFeature([
      { name: CloudflareCredentials.name, schema: CloudflareCredentialsSchema },
    ]),
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