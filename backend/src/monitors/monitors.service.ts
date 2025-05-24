import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import { Monitor, MonitorDocument } from './schemas/monitor.schema';
import { MonitorLog, MonitorLogDocument } from './schemas/monitor-log.schema';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { MonitoringJobData } from './processors/monitoring.processor';

@Injectable()
export class MonitorsService implements OnModuleInit {
  constructor(
    @InjectModel(Monitor.name) private monitorModel: Model<MonitorDocument>,
    @InjectModel(MonitorLog.name) private monitorLogModel: Model<MonitorLogDocument>,
    @InjectQueue('monitoring') private monitoringQueue: Queue,
  ) {}

  async onModuleInit() {
    // Initialize bulk monitor check job when application starts
    await this.scheduleBulkMonitorCheck();
    
    // Schedule jobs for existing active monitors
    await this.initializeExistingMonitors();
  }

  private async initializeExistingMonitors(): Promise<void> {
    try {
      const activeMonitors = await this.monitorModel.find({ isActive: true });
      console.log(`Initializing ${activeMonitors.length} active monitors...`);
      
      for (const monitor of activeMonitors) {
        await this.scheduleMonitorCheck((monitor as MonitorDocument)._id.toString());
      }
      
      console.log('All active monitors initialized successfully');
    } catch (error) {
      console.error('Error initializing existing monitors:', error);
    }
  }

  async create(createMonitorDto: CreateMonitorDto, userId: string): Promise<Monitor> {
    const monitor = new this.monitorModel({
      ...createMonitorDto,
      userId,
    });
    const savedMonitor = await monitor.save();
    
    // Schedule initial check
    await this.scheduleMonitorCheck(savedMonitor._id.toString());
    
    return savedMonitor;
  }

  async findAll(userId: string): Promise<Monitor[]> {
    return this.monitorModel.find({ userId }).exec();
  }

  async findOne(id: string, userId: string): Promise<Monitor> {
    const monitor = await this.monitorModel.findOne({ _id: id, userId }).exec();
    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }
    return monitor;
  }

  async update(id: string, updateMonitorDto: UpdateMonitorDto, userId: string): Promise<Monitor> {
    const monitor = await this.monitorModel
      .findOneAndUpdate({ _id: id, userId }, updateMonitorDto, { new: true })
      .exec();
    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }
    
    // Reschedule monitor check if interval changed
    if (updateMonitorDto.interval) {
      await this.scheduleMonitorCheck(id);
    }
    
    return monitor;
  }

  async remove(id: string, userId: string): Promise<void> {
    // Remove scheduled jobs first
    await this.removeScheduledCheck(id);
    
    const result = await this.monitorModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Monitor not found');
    }
  }

  async getStats(id: string, userId: string) {
    const monitor = await this.findOne(id, userId);
    
    const logs = await this.monitorLogModel
      .find({ monitorId: id })
      .sort({ checkedAt: -1 })
      .limit(100)
      .exec();

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(log => log.checkedAt >= last24Hours);

    return {
      monitor,
      stats: {
        totalChecks: monitor.totalChecks,
        successfulChecks: monitor.successfulChecks,
        failedChecks: monitor.failedChecks,
        uptimePercentage: monitor.uptimePercentage,
        averageResponseTime: this.calculateAverageResponseTime(recentLogs),
        last24HoursUptime: this.calculateUptime(recentLogs),
      },
      recentLogs: logs.slice(0, 20),
    };
  }

  private calculateAverageResponseTime(logs: MonitorLog[]): number {
    if (logs.length === 0) return 0;
    const total = logs.reduce((sum, log) => sum + (log.responseTime || 0), 0);
    return Math.round(total / logs.length);
  }

  private calculateUptime(logs: MonitorLog[]): number {
    if (logs.length === 0) return 0;
    const successCount = logs.filter(log => log.result === 'success').length;
    return Math.round((successCount / logs.length) * 100);
  }

  async scheduleMonitorCheck(monitorId: string): Promise<void> {
    const monitor = await this.monitorModel.findById(monitorId);
    if (!monitor || !monitor.isActive) {
      return;
    }

    // Remove existing scheduled job first
    await this.removeScheduledCheck(monitorId);

    // Add immediate check
    await this.monitoringQueue.add(
      'check-monitor',
      { monitorId, type: 'single-check' } as MonitoringJobData,
      {
        delay: 1000, // 1 second delay for immediate check
      }
    );

    // Add recurring check using every (milliseconds)
    await this.monitoringQueue.add(
      'check-monitor',
      { monitorId, type: 'single-check' } as MonitoringJobData,
      {
        repeat: { every: monitor.interval * 1000 }, // Convert seconds to milliseconds
        jobId: `monitor-${monitorId}`, // Unique job ID to prevent duplicates
      }
    );
  }

  async scheduleBulkMonitorCheck(): Promise<void> {
    await this.monitoringQueue.add(
      'check-all-monitors',
      { monitorId: 'all', type: 'bulk-check' } as MonitoringJobData,
      {
        repeat: { cron: '0 */5 * * * *' }, // Every 5 minutes
        jobId: 'bulk-monitor-check',
      }
    );
  }

  async removeScheduledCheck(monitorId: string): Promise<void> {
    // Remove the recurring job for this monitor
    const jobs = await this.monitoringQueue.getRepeatableJobs();
    const monitorJob = jobs.find(job => job.id === `monitor-${monitorId}`);
    if (monitorJob) {
      await this.monitoringQueue.removeRepeatableByKey(monitorJob.key);
    }
  }

  async getQueueInfo(): Promise<any> {
    const waiting = await this.monitoringQueue.getWaiting();
    const active = await this.monitoringQueue.getActive();
    const completed = await this.monitoringQueue.getCompleted();
    const failed = await this.monitoringQueue.getFailed();
    const delayed = await this.monitoringQueue.getDelayed();
    const repeatableJobs = await this.monitoringQueue.getRepeatableJobs();

    return {
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        repeatable: repeatableJobs.length,
      },
      repeatableJobs: repeatableJobs.map(job => ({
        id: job.id,
        name: job.name,
        cron: job.cron,
        every: job.every,
        next: job.next,
      })),
      recentJobs: {
        waiting: waiting.slice(0, 5).map(job => ({ id: job.id, data: job.data })),
        active: active.slice(0, 5).map(job => ({ id: job.id, data: job.data })),
        completed: completed.slice(0, 5).map(job => ({ id: job.id, data: job.data })),
        failed: failed.slice(0, 5).map(job => ({ id: job.id, data: job.data, failedReason: job.failedReason })),
      }
    };
  }
} 