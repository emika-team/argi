import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DomainDocument = Domain & Document;

@Schema({ timestamps: true })
export class Domain {
  @Prop({ required: true })
  domain: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  lastCheckedAt: Date;

  @Prop()
  lastExpiryDate: Date;

  @Prop()
  lastDaysUntilExpiry: number;

  @Prop()
  lastError: string;

  @Prop({ default: false })
  isExpired: boolean;

  @Prop({ default: false })
  isExpiringSoon: boolean;

  // Alert settings
  @Prop({ default: true })
  enableExpiryAlerts: boolean;

  @Prop({ default: 30 })
  alertDaysBefore: number;
}

export const DomainSchema = SchemaFactory.createForClass(Domain);

// Create compound index for userId and domain to ensure uniqueness per user
DomainSchema.index({ userId: 1, domain: 1 }, { unique: true }); 