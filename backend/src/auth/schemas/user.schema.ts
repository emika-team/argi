import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt: Date;

  @Prop()
  resetPasswordToken: string;

  @Prop()
  resetPasswordExpires: Date;

  // Telegram notification settings
  @Prop()
  telegramChatId: string;

  @Prop({ default: false })
  enableTelegramAlerts: boolean;

  // Cloudflare integration settings
  @Prop()
  cloudflareEmail: string;

  @Prop()
  cloudflareApiKey: string;
}

export const UserSchema = SchemaFactory.createForClass(User); 