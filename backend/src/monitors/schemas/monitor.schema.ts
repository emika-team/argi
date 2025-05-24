import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MonitorDocument = Monitor & Document;

export enum MonitorType {
  HTTP = 'http',
  HTTPS = 'https',
  TCP = 'tcp',
  PING = 'ping',
}

export enum MonitorStatus {
  UP = 'up',
  DOWN = 'down',
  PENDING = 'pending',
  PAUSED = 'paused',
}

@Schema({ timestamps: true })
export class Monitor {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: String, enum: MonitorType, default: MonitorType.HTTPS })
  type: MonitorType;

  @Prop({ type: String, enum: MonitorStatus, default: MonitorStatus.PENDING })
  status: MonitorStatus;

  @Prop({ default: 60 }) // seconds
  interval: number;

  @Prop({ default: 30000 }) // milliseconds
  timeout: number;

  @Prop({ default: 3 })
  maxRetries: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: Date.now })
  lastCheckedAt: Date;

  @Prop()
  lastResponseTime: number;

  @Prop()
  lastStatusCode: number;

  @Prop()
  lastError: string;

  @Prop({ default: 0 })
  uptimePercentage: number;

  @Prop({ default: 0 })
  totalChecks: number;

  @Prop({ default: 0 })
  successfulChecks: number;

  @Prop({ default: 0 })
  failedChecks: number;

  // Alert settings
  @Prop({ default: true })
  enableEmailAlerts: boolean;

  @Prop({ default: false })
  enableLineAlerts: boolean;

  @Prop({ default: false })
  enableDiscordAlerts: boolean;

  @Prop({ type: [String], default: [] })
  alertEmails: string[];
}

export const MonitorSchema = SchemaFactory.createForClass(Monitor); 