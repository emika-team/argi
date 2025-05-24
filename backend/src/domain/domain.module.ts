import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';

import { DomainService } from './domain.service';
import { DomainController } from './domain.controller';
import { DomainScheduler } from './domain.scheduler';
import { DomainProcessor, DOMAIN_QUEUE } from './domain.processor';
import { DomainQueueService } from './domain-queue.service';
import { Domain, DomainSchema } from './schemas/domain.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Domain.name, schema: DomainSchema },
      { name: User.name, schema: UserSchema },
    ]),
    BullModule.registerQueue({
      name: DOMAIN_QUEUE,
    }),
  ],
  controllers: [DomainController],
  providers: [
    DomainService, 
    DomainScheduler, 
    DomainProcessor,
    DomainQueueService
  ],
  exports: [DomainService, DomainQueueService],
})
export class DomainModule {} 