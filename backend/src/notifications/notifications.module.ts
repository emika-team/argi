import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SlackService } from './slack.service';

@Module({
  providers: [NotificationsService, SlackService],
  exports: [NotificationsService, SlackService],
})
export class NotificationsModule {} 