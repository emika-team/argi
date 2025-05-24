import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import * as ping from 'ping';
import { Monitor, MonitorDocument, MonitorType, MonitorStatus } from '../schemas/monitor.schema';
import { MonitorLog, MonitorLogDocument, CheckResult } from '../schemas/monitor-log.schema';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectModel(Monitor.name) private monitorModel: Model<MonitorDocument>,
    @InjectModel(MonitorLog.name) private monitorLogModel: Model<MonitorLogDocument>,
  ) {}

  async checkMonitor(monitorId: string): Promise<void> {
    const monitor = await this.monitorModel.findById(monitorId);
    if (!monitor || !monitor.isActive) {
      this.logger.warn(`Monitor ${monitorId} not found or inactive`);
      return;
    }

    this.logger.log(`Checking monitor: ${monitor.name} (${monitor.url})`);
    const startTime = Date.now();
    let result: CheckResult;
    let responseTime: number;
    let statusCode: number;
    let error: string;
    let headers: Record<string, string> = {};

    try {
      switch (monitor.type) {
        case MonitorType.HTTP:
        case MonitorType.HTTPS:
          const response = await this.checkHttp(monitor);
          result = CheckResult.SUCCESS;
          responseTime = Date.now() - startTime;
          statusCode = response.status;
          headers = Object.fromEntries(
            Object.entries(response.headers).map(([key, value]) => [
              key, 
              typeof value === 'string' ? value : String(value)
            ])
          );
          break;

        case MonitorType.PING:
          const pingResult = await this.checkPing(monitor);
          result = pingResult.alive ? CheckResult.SUCCESS : CheckResult.FAILURE;
          responseTime = pingResult.time || 0;
          statusCode = pingResult.alive ? 200 : 0;
          break;

        case MonitorType.TCP:
          // TCP check implementation would go here
          result = CheckResult.SUCCESS;
          responseTime = Date.now() - startTime;
          statusCode = 200;
          break;

        default:
          throw new Error('Unsupported monitor type');
      }
    } catch (err) {
      result = CheckResult.FAILURE;
      responseTime = Date.now() - startTime;
      statusCode = err.response?.status || 0;
      error = err.message;
    }

    // Save log
    await this.saveMonitorLog({
      monitorId: (monitor as MonitorDocument)._id.toString(),
      result,
      responseTime,
      statusCode,
      error,
      headers,
    });

    // Update monitor stats
    await this.updateMonitorStats(monitor, result, responseTime, statusCode, error);
    
    this.logger.log(`Monitor check completed: ${monitor.name} - ${result} (${responseTime}ms)`);
  }

  private async checkHttp(monitor: Monitor) {
    return axios({
      method: 'GET',
      url: monitor.url,
      timeout: monitor.timeout,
      validateStatus: (status) => status < 400, // Accept 2xx and 3xx as success
    });
  }

  private async checkPing(monitor: Monitor) {
    const url = new URL(monitor.url);
    return ping.promise.probe(url.hostname, {
      timeout: monitor.timeout / 1000, // ping expects seconds
    });
  }

  private async saveMonitorLog(logData: any) {
    const log = new this.monitorLogModel({
      ...logData,
      checkedAt: new Date(),
    });
    await log.save();
  }

  private async updateMonitorStats(
    monitor: Monitor,
    result: CheckResult,
    responseTime: number,
    statusCode: number,
    error?: string,
  ) {
    const isSuccess = result === CheckResult.SUCCESS;
    const totalChecks = monitor.totalChecks + 1;
    const successfulChecks = monitor.successfulChecks + (isSuccess ? 1 : 0);
    const failedChecks = monitor.failedChecks + (isSuccess ? 0 : 1);
    const uptimePercentage = Math.round((successfulChecks / totalChecks) * 100);

    const updateData: any = {
      status: isSuccess ? MonitorStatus.UP : MonitorStatus.DOWN,
      lastCheckedAt: new Date(),
      lastResponseTime: responseTime,
      lastStatusCode: statusCode,
      totalChecks,
      successfulChecks,
      failedChecks,
      uptimePercentage,
    };

    if (error) {
      updateData.lastError = error;
    }

    await this.monitorModel.findByIdAndUpdate((monitor as MonitorDocument)._id, updateData);
  }

  async checkAllActiveMonitors(): Promise<void> {
    const activeMonitors = await this.monitorModel.find({ isActive: true });
    this.logger.log(`Checking ${activeMonitors.length} active monitors`);
    
    for (const monitor of activeMonitors) {
      try {
        await this.checkMonitor((monitor as MonitorDocument)._id.toString());
      } catch (error) {
        this.logger.error(`Error checking monitor ${(monitor as MonitorDocument)._id}:`, error);
      }
    }
    
    this.logger.log('Bulk monitor check completed');
  }
} 