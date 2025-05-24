import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MonitorLogDocument = MonitorLog & Document;

export enum CheckResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  TIMEOUT = 'timeout',
}

@Schema({ timestamps: true })
export class MonitorLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Monitor', required: true })
  monitorId: string;

  @Prop({ type: String, enum: CheckResult, required: true })
  result: CheckResult;

  @Prop()
  responseTime: number;

  @Prop()
  statusCode: number;

  @Prop()
  error: string;

  @Prop()
  responseSize: number;

  @Prop()
  serverIp: string;

  @Prop({ default: Date.now })
  checkedAt: Date;

  @Prop()
  httpVersion: string;

  @Prop({ type: Object })
  headers: Record<string, string>;

  @Prop()
  redirectCount: number;

  @Prop()
  dnsLookupTime: number;

  @Prop()
  connectTime: number;

  @Prop()
  sslHandshakeTime: number;
}

export const MonitorLogSchema = SchemaFactory.createForClass(MonitorLog); 