import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email, isActive: true });
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    await user.save();
    const { password, ...result } = user.toObject();
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const payload = { 
      email: user.email, 
      sub: user._id,
      role: user.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async findById(id: string): Promise<UserDocument> {
    return this.userModel.findById(id).select('-password');
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email }).select('-password');
  }

  async updateUserSettings(userId: string, updates: any): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select('-password');
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return user;
  }

  async getUserSettings(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('telegramChatId enableTelegramAlerts cloudflareEmail');
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return {
      telegramChatId: user.telegramChatId,
      enableTelegramAlerts: user.enableTelegramAlerts,
      hasCloudflareCredentials: !!user.cloudflareEmail && !!user.cloudflareApiKey,
      cloudflareEmail: user.cloudflareEmail,
    };
  }

  async getCloudflareCredentials(userId: string): Promise<{ email: string; apiKey: string } | null> {
    const user = await this.userModel.findById(userId).select('cloudflareEmail cloudflareApiKey');
    
    if (!user || !user.cloudflareEmail || !user.cloudflareApiKey) {
      return null;
    }
    
    return {
      email: user.cloudflareEmail,
      apiKey: user.cloudflareApiKey,
    };
  }
} 