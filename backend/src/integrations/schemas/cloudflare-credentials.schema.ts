import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CloudflareCredentialsDocument = CloudflareCredentials & Document;

@Schema({ timestamps: true })
export class CloudflareCredentials {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: string;

  @Prop()
  email: string; // Optional for API tokens

  @Prop({ required: true })
  apiKey: string; // Can be API Token or Global API Key

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastValidatedAt: Date;

  @Prop()
  lastError: string;

  @Prop({ type: Object })
  metadata: Record<string, any>; // Store user info or other metadata
}

export const CloudflareCredentialsSchema = SchemaFactory.createForClass(CloudflareCredentials);

// Create index for userId to ensure one credential set per user
CloudflareCredentialsSchema.index({ userId: 1 }, { unique: true });
