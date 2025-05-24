# Domain Monitoring with Bull Queue

This system implements automated domain monitoring using Bull Queue (Redis-based queue system) to check domain expiry status every 5 minutes.

## Features

- **Automated Monitoring**: Checks all active domains every 5 minutes
- **Queue-based Processing**: Uses Bull Queue for reliable job processing
- **Individual Domain Checks**: Can trigger checks for specific domains or users
- **Queue Management**: Full control over queue operations (pause, resume, clear)
- **Health Monitoring**: Backup checks and queue health monitoring
- **Bull Board Integration**: Visual queue monitoring dashboard

## Components

### 1. DomainProcessor (`domain.processor.ts`)
Handles the actual processing of domain monitoring jobs:
- `check-single-domain`: Check a specific domain
- `check-user-domains`: Check all domains for a specific user
- `check-all-domains`: Check all active domains in the system

### 2. DomainQueueService (`domain-queue.service.ts`)
Manages queue operations and job scheduling:
- Automatically sets up repeatable job every 5 minutes
- Provides methods to add various types of monitoring jobs
- Queue statistics and management functions

### 3. Updated DomainService (`domain.service.ts`)
Extended with:
- `getAllActiveDomains()`: Get all active domains for batch processing
- Enhanced status updating with queue integration

### 4. DomainScheduler (`domain.scheduler.ts`)
Provides backup monitoring:
- Backup check every 6 hours (fallback if queue fails)
- Hourly queue health checks
- Manual trigger functions

## API Endpoints

### Queue Management
```
GET    /domain/queue/stats              - Get queue statistics
POST   /domain/queue/check-all          - Trigger all domains check
POST   /domain/queue/check-user/:userId - Trigger user domains check
POST   /domain/queue/check-domain       - Trigger single domain check
POST   /domain/queue/pause              - Pause the queue
POST   /domain/queue/resume             - Resume the queue
POST   /domain/queue/clear              - Clear all jobs from queue
```

### Examples

#### Get Queue Statistics
```bash
curl http://localhost:3000/domain/queue/stats
```

#### Trigger All Domains Check
```bash
curl -X POST http://localhost:3000/domain/queue/check-all
```

#### Trigger User Domains Check
```bash
curl -X POST http://localhost:3000/domain/queue/check-user/60f8c2d4e1b2c8a2a1234567
```

#### Trigger Single Domain Check
```bash
curl -X POST http://localhost:3000/domain/queue/check-domain \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com", "domainId": "60f8c2d4e1b2c8a2a1234568"}'
```

## Configuration

### Environment Variables
Make sure these are set in your `.env` file:
```
REDIS_HOST=localhost
REDIS_PORT=6379
MONGODB_URI=mongodb://localhost:27017/uptime-monitor
```

### Queue Settings
The queue is configured with:
- **Repeat**: Every 5 minutes (`*/5 * * * *`)
- **Remove on Complete**: Keep last 10 completed jobs
- **Remove on Fail**: Keep last 50 failed jobs
- **Job Timeout**: Default Bull timeout

## Monitoring and Debugging

### Bull Board Dashboard
The system includes Bull Board integration for visual monitoring:
- Access at: `http://localhost:3000/admin/queues`
- View active, waiting, completed, and failed jobs
- Retry failed jobs manually
- Monitor queue performance

### Logging
The system provides comprehensive logging:
- Job processing status
- Domain check results
- Queue health status
- Error handling and retries

### Health Checks
- **Queue Health**: Checked every hour
- **Backup Monitoring**: Every 6 hours if queue is not working
- **Job Retention**: Automatic cleanup of old jobs

## Job Types and Data Structure

### DomainMonitoringJob Interface
```typescript
interface DomainMonitoringJob {
  type: 'check-single-domain' | 'check-all-domains' | 'check-user-domains';
  domainId?: string;
  userId?: string;
  domain?: string;
}
```

### Job Processing Flow
1. **Job Creation**: Jobs are added to the queue by DomainQueueService
2. **Job Processing**: DomainProcessor handles the actual domain checks
3. **Status Updates**: Results are saved to MongoDB via DomainService
4. **Cleanup**: Completed/failed jobs are automatically removed based on settings

## Performance Considerations

- **Rate Limiting**: 1-second delay between domain checks to avoid overwhelming external WHOIS services
- **Batch Processing**: All domains are processed in a single job to optimize resource usage
- **Error Handling**: Failed jobs are retried automatically by Bull
- **Memory Management**: Old jobs are automatically cleaned up

## Troubleshooting

### Common Issues

1. **Queue Not Starting**
   - Check Redis connection
   - Verify REDIS_HOST and REDIS_PORT environment variables

2. **Jobs Failing**
   - Check logs for specific error messages
   - Verify domain formats and external service availability
   - Use Bull Board to inspect failed jobs

3. **No Domains Being Checked**
   - Verify domains are marked as `isActive: true`
   - Check if repeatable job is scheduled: `GET /domain/queue/stats`

4. **High Memory Usage**
   - Adjust job retention settings
   - Monitor queue size and clear if necessary

### Manual Recovery
If the queue gets stuck or needs to be reset:

```bash
# Clear all jobs
curl -X POST http://localhost:3000/domain/queue/clear

# Resume queue
curl -X POST http://localhost:3000/domain/queue/resume

# Trigger manual check
curl -X POST http://localhost:3000/domain/queue/check-all
```

## Future Enhancements

- **Priority Queue**: Implement priority levels for urgent domain checks
- **Notification Integration**: Connect with notification system for expiry alerts
- **Metrics Collection**: Add Prometheus metrics for monitoring
- **Dynamic Scheduling**: Allow users to configure check intervals
- **Retry Strategies**: Implement exponential backoff for failed checks 