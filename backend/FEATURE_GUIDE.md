# Feature Guide: Slack Notifications & Cloudflare Credentials Storage

This guide provides a quick reference for the newly added features.

## Features Overview

### 1. Slack Notifications
Get real-time domain expiry alerts directly in your Slack workspace.

### 2. Cloudflare Credentials Storage
Store Cloudflare API credentials securely in the database for easier domain imports.

### 3. Hourly Domain Checks
Automatic domain expiry checks every hour with bot detection avoidance.

## Quick Start

### Setting Up Slack Notifications

1. **Create Slack Webhook**
   - Go to https://api.slack.com/apps
   - Create a new app → Enable Incoming Webhooks
   - Add webhook to your channel
   - Copy the webhook URL

2. **Configure Backend**
   ```env
   # Add to backend/.env
   ENABLE_SLACK_ALERTS=true
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. **Restart Backend**
   ```bash
   cd backend
   npm run start:dev
   ```

4. **Verify Setup**
   - Check logs for "Slack notifications enabled"
   - Wait for next hourly domain check or trigger manually

### Storing Cloudflare Credentials

1. **Save Credentials (One-time)**
   ```bash
   curl -X POST http://localhost:8000/api/integrations/cloudflare/credentials/:userId \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your@email.com",
       "apiKey": "your-api-token"
     }'
   ```

2. **Import Domains Using Stored Credentials**
   ```bash
   curl -X POST http://localhost:8000/api/integrations/cloudflare/import-with-stored/:userId
   ```

3. **Check Credentials Status**
   ```bash
   curl http://localhost:8000/api/integrations/cloudflare/credentials/:userId/status
   ```

## API Reference

### Slack Service Methods

```typescript
import { SlackService } from './notifications/slack.service';

// Inject in your service
constructor(private slackService: SlackService) {}

// Send domain expiry alert
await this.slackService.sendDomainExpiryAlert(
  'example.com',      // domain name
  7,                  // days until expiry
  '2024-01-15'        // expiry date
);

// Send expired domain alert
await this.slackService.sendDomainExpiredAlert('example.com');

// Send bulk report
await this.slackService.sendBulkDomainReport([
  { domain: 'example.com', daysUntilExpiry: 7 },
  { domain: 'test.com', daysUntilExpiry: 15 }
]);
```

### Cloudflare Credentials Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations/cloudflare/credentials/:userId` | POST | Save/update credentials |
| `/api/integrations/cloudflare/credentials/:userId` | GET | Get credentials info |
| `/api/integrations/cloudflare/credentials/:userId` | DELETE | Delete credentials |
| `/api/integrations/cloudflare/credentials/:userId/status` | GET | Check if credentials exist |
| `/api/integrations/cloudflare/import-with-stored/:userId` | POST | Import domains with stored credentials |

## How It Works

### Automatic Domain Checking

```
Every Hour
    ↓
Random Delay (0-30s) to avoid bot detection
    ↓
Get All Active Domains
    ↓
For Each Domain:
    ├─ Random Delay (1-5s) between checks
    ├─ Check WHOIS expiry date
    ├─ Update database
    └─ Send Slack notification (if expiring/expired)
```

### Notification Logic

```typescript
if (domain.isExpired) {
  // Send CRITICAL alert (red)
  slackService.sendDomainExpiredAlert(domain);
} else if (domain.daysUntilExpiry <= 7) {
  // Send URGENT alert (red)
  slackService.sendDomainExpiryAlert(domain, daysUntilExpiry, expiryDate);
} else if (domain.daysUntilExpiry <= 30) {
  // Send WARNING alert (orange)
  slackService.sendDomainExpiryAlert(domain, daysUntilExpiry, expiryDate);
}
```

## Configuration

### Domain Schema

Each domain can have individual alert settings:

```typescript
{
  enableExpiryAlerts: true,    // Enable/disable alerts for this domain
  alertDaysBefore: 30,          // Alert threshold in days
  // ... other fields
}
```

### Scheduler Configuration

The scheduler runs at specific intervals:

```typescript
// Every hour - Auto check all domains
@Cron(CronExpression.EVERY_HOUR)
async autoCheckActiveDomains() { ... }

// Every 30 minutes - Queue health check
@Cron(CronExpression.EVERY_30_MINUTES)
async queueHealthCheck() { ... }

// Every 6 hours - Backup check (fallback)
@Cron(CronExpression.EVERY_6_HOURS)
async backupDomainCheck() { ... }
```

## Testing

### Test Slack Notification Manually

1. **Via Domain Processor**
   ```typescript
   // In your test file or script
   import { SlackService } from './notifications/slack.service';
   
   const slackService = new SlackService(configService);
   await slackService.sendDomainExpiryAlert('test.com', 5, '2024-01-15');
   ```

2. **Via Queue Dashboard**
   - Visit: http://localhost:8000/admin/queues
   - Find domain queue
   - Manually trigger a job

3. **Via API**
   ```bash
   # Trigger single domain check
   curl -X POST http://localhost:8000/api/domain/check/example.com
   ```

### Test Cloudflare Integration

1. **Validate Credentials**
   ```bash
   curl -X POST http://localhost:8000/api/integrations/cloudflare/validate \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your@email.com",
       "apiKey": "your-token"
     }'
   ```

2. **Save and Import**
   ```bash
   # Save credentials
   curl -X POST http://localhost:8000/api/integrations/cloudflare/credentials/:userId \
     -H "Content-Type: application/json" \
     -d '{"email": "your@email.com", "apiKey": "your-token"}'
   
   # Import domains
   curl -X POST http://localhost:8000/api/integrations/cloudflare/import-with-stored/:userId
   ```

## Monitoring

### Check Queue Status

```bash
# Via API
curl http://localhost:8000/api/domain/queue/stats

# Via Bull Board
# Open: http://localhost:8000/admin/queues
```

### View Logs

```bash
# Real-time logs
cd backend
npm run start:dev

# Filter for Slack
npm run start:dev | grep Slack

# Filter for domain checks
npm run start:dev | grep "Domain"
```

## Troubleshooting

### Slack Notifications Not Working

1. Check environment variables are set correctly
2. Verify webhook URL is valid (test with curl)
3. Check `ENABLE_SLACK_ALERTS=true`
4. Restart backend after .env changes
5. Check logs for Slack-related errors

### Cloudflare Credentials Issues

1. Verify API token has correct permissions
2. Check token hasn't expired
3. Use `/validate` endpoint to test credentials
4. Check database for stored credentials
5. Review `lastError` field in credentials document

### Domain Not Being Checked

1. Verify domain `isActive: true`
2. Check queue dashboard for pending jobs
3. Verify domain exists in database
4. Check scheduler logs for errors
5. Manually trigger check via API

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` to version control
   - Use different credentials for development/production
   - Rotate API tokens regularly

2. **Cloudflare Credentials**
   - Store credentials per user
   - Use API tokens instead of Global API Keys when possible
   - Implement field-level encryption for sensitive data
   - Validate credentials before storage

3. **Slack Webhooks**
   - Keep webhook URLs secret
   - Use dedicated channels for alerts
   - Limit access to notification channels
   - Review message content for sensitive data

## Performance Considerations

### Bot Detection Avoidance

The system includes several mechanisms to avoid being detected as a bot:

1. **Random Delays**
   - 0-30 seconds before starting batch checks
   - 1-5 seconds between individual domain checks

2. **Staggered Execution**
   - Hourly checks spread across 60 minutes
   - Individual queues per domain
   - Randomized check timing

3. **Rate Limiting**
   - Respects WHOIS server rate limits
   - Backs off on errors
   - Uses individual queues to distribute load

### Scaling Considerations

- Individual queues per domain allow horizontal scaling
- Redis clustering supported for high availability
- MongoDB indexes optimize query performance
- Bull queue handles job distribution automatically

## Migration Guide

### From Manual Credentials to Stored Credentials

If you're currently passing credentials in each request:

```typescript
// Old way (still supported)
await integrationsService.importDomainsFromCloudflare({
  userId: 'user-id',
  email: 'user@example.com',
  apiKey: 'token'
});

// New way (recommended)
// 1. Save credentials once
await integrationsService.saveCloudflareCredentials('user-id', {
  email: 'user@example.com',
  apiKey: 'token'
});

// 2. Import without credentials
await integrationsService.importDomainsWithStoredCredentials('user-id');
```

## Support

For issues or questions:
- Check the logs first
- Review the documentation
- Check GitHub issues
- Contact the development team

## Additional Resources

- [Slack API Documentation](https://api.slack.com/)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
- [NestJS Cron Documentation](https://docs.nestjs.com/techniques/task-scheduling)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
