import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';

import { MonitorsController } from './monitors.controller';
import { MonitorsService } from './monitors.service';
import { MonitoringService } from './services/monitoring.service';
import { MonitoringProcessor } from './processors/monitoring.processor';
import { Monitor, MonitorSchema } from './schemas/monitor.schema';
import { MonitorLog, MonitorLogSchema } from './schemas/monitor-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Monitor.name, schema: MonitorSchema },
      { name: MonitorLog.name, schema: MonitorLogSchema },
    ]),
    BullModule.registerQueue({
      name: 'monitoring',
    }),
  ],
  controllers: [MonitorsController],
  providers: [MonitorsService, MonitoringService, MonitoringProcessor],
  exports: [MonitorsService],
})
export class MonitorsModule {} 