import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Monitor, MonitorDocument } from '../monitors/schemas/monitor.schema';
import { MonitorLog, MonitorLogDocument } from '../monitors/schemas/monitor-log.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Monitor.name) private monitorModel: Model<MonitorDocument>,
    @InjectModel(MonitorLog.name) private monitorLogModel: Model<MonitorLogDocument>,
  ) {}

  async getDashboardData() {
    // This is a simple implementation
    // In a real application, you would implement proper dashboard data aggregation
    const monitors = await this.monitorModel.find().limit(10);
    const recentLogs = await this.monitorLogModel
      .find()
      .sort({ checkedAt: -1 })
      .limit(20);

    return {
      totalMonitors: monitors.length,
      activeMonitors: monitors.filter(m => m.isActive).length,
      upMonitors: monitors.filter(m => m.status === 'up').length,
      downMonitors: monitors.filter(m => m.status === 'down').length,
      averageUptime: monitors.length > 0 
        ? Math.round(monitors.reduce((sum, m) => sum + m.uptimePercentage, 0) / monitors.length)
        : 0,
      recentMonitors: monitors,
      recentLogs,
    };
  }
} 