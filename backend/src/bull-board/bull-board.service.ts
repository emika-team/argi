import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

@Injectable()
export class BullBoardService implements OnModuleInit {
  private serverAdapter: ExpressAdapter;

  constructor(
    @InjectQueue('monitoring') private monitoringQueue: Queue,
  ) {
    this.serverAdapter = new ExpressAdapter();
    // Don't set base path here, let the controller handle routing
  }

  onModuleInit() {
    createBullBoard({
      queues: [new BullAdapter(this.monitoringQueue)],
      serverAdapter: this.serverAdapter,
    });
  }

  getRouter() {
    return this.serverAdapter.getRouter();
  }
} 