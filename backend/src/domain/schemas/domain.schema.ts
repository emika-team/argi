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

  // 3rd Party Provider Information
  @Prop({ default: 'manual' })
  provider: string; // 'manual', 'cloudflare', 'godaddy', etc.

  @Prop()
  providerId: string; // Provider's zone/domain ID

  @Prop()
  providerStatus: string; // Provider-specific status

  @Prop({ default: false })
  isPaused: boolean; // For providers like Cloudflare

  @Prop({ type: [String], default: [] })
  nameServers: string[];

  @Prop({ type: [String], default: [] })
  originalNameServers: string[];

  @Prop()
  originalRegistrar: string;

  @Prop()
  activatedAt: Date; // When domain was activated on provider

  @Prop({ type: Object })
  providerMetadata: Record<string, any>; // Additional provider-specific data
}

export const DomainSchema = SchemaFactory.createForClass(Domain);

// Create compound index for userId and domain to ensure uniqueness per user
DomainSchema.index({ userId: 1, domain: 1 }, { unique: true });

// Add index for provider queries
DomainSchema.index({ provider: 1, providerId: 1 }); 