import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';

export interface MonitoringJobData {
  monitorId: string;
  type: 'single-check' | 'bulk-check';
}

@Processor('monitoring')
@Injectable()
export class MonitoringProcessor {
  private readonly logger = new Logger(MonitoringProcessor.name);

  constructor(private readonly monitoringService: MonitoringService) {}

  @Process('check-monitor')
  async handleMonitorCheck(job: Job<MonitoringJobData>) {
    this.logger.log(`Processing monitor check job for monitor: ${job.data.monitorId}, type: ${job.data.type}`);
    
    try {
      await this.monitoringService.checkMonitor(job.data.monitorId);
      this.logger.log(`Successfully checked monitor: ${job.data.monitorId}`);
    } catch (error) {
      this.logger.error(`Failed to check monitor ${job.data.monitorId}:`, error);
      throw error;
    }
  }

  @Process('check-all-monitors')
  async handleBulkMonitorCheck(job: Job<MonitoringJobData>) {
    this.logger.log('Processing bulk monitor check job');
    
    try {
      await this.monitoringService.checkAllActiveMonitors();
      this.logger.log('Successfully checked all active monitors');
    } catch (error) {
      this.logger.error('Failed to check all monitors:', error);
      throw error;
    }
  }
} 