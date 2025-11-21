import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';

import { DomainService } from './domain.service';
import { DomainController } from './domain.controller';
import { DomainScheduler } from './domain.scheduler';
import { DomainProcessorFactory, LegacyDomainProcessor } from './domain.processor';
import { DomainQueueService } from './domain-queue.service';
import { Domain, DomainSchema } from './schemas/domain.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Domain.name, schema: DomainSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
    // Note: Individual domain queues will be created dynamically
    // No need to register a global domain queue here
  ],
  controllers: [DomainController],
  providers: [
    DomainService, 
    DomainScheduler, 
    DomainProcessorFactory,
    LegacyDomainProcessor, // Keep for backward compatibility
    DomainQueueService
  ],
  exports: [DomainService, DomainQueueService, DomainProcessorFactory],
})
export class DomainModule {} 