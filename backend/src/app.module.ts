import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { MonitorsModule } from './monitors/monitors.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SslModule } from './ssl';
import { DomainModule } from './domain/domain.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BullBoardModule } from './bull-board/bull-board.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Redis & Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        if (redisUrl) {
          // Parse Redis URL if provided
          const url = new URL(redisUrl);
          return {
            redis: {
              host: url.hostname,
              port: parseInt(url.port) || 6379,
            },
          };
        }
        // Fallback to individual host/port
        return {
          redis: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
          },
        };
      },
      inject: [ConfigService],
    }),

    // Scheduler
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Feature modules
    AuthModule,
    MonitorsModule,
    NotificationsModule,
    SslModule,
    DomainModule,
    DashboardModule,
    BullBoardModule,
    IntegrationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Bull Board middleware will be configured in the service
  }
} 