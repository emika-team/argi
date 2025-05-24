import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MonitorsService } from '../monitors/monitors.service';

async function testQueue() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const monitorsService = app.get(MonitorsService);

  try {
    console.log('Scheduling bulk monitor check...');
    await monitorsService.scheduleBulkMonitorCheck();
    console.log('Bulk monitor check scheduled successfully!');
    
    console.log('Visit http://localhost:8000/admin/queues to see the Bull Board dashboard');
  } catch (error) {
    console.error('Error scheduling bulk check:', error);
  } finally {
    await app.close();
  }
}

testQueue(); 