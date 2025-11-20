# Slack Notifications

This feature enables automatic Slack notifications for domain expiry alerts, providing real-time visibility into domain status directly in your Slack workspace.

## Features

- **Automatic Domain Expiry Alerts**: Get notified when domains are expiring soon
- **Severity Levels**: Different alerts based on urgency (Critical, Warning, Notice)
- **Rich Formatting**: Structured Slack messages with color-coded attachments
- **Bulk Reports**: Summary reports for multiple expiring domains
- **Configurable**: Easy to enable/disable via environment variables

## Setup

### 1. Create Slack Incoming Webhook

1. Go to your Slack workspace settings
2. Navigate to **Apps** → **Manage** → **Custom Integrations** → **Incoming Webhooks**
3. Click **Add to Slack**
4. Choose a channel where notifications will be posted
5. Copy the **Webhook URL**

Alternative (Recommended for new workspaces):
1. Create a new Slack App at https://api.slack.com/apps
2. Enable **Incoming Webhooks** under **Features**
3. Add a new webhook and select your channel
4. Copy the webhook URL

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Enable Slack notifications
ENABLE_SLACK_ALERTS=true

# Slack webhook URL
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Restart Backend

Restart the backend service to apply the new configuration:

```bash
npm run start:dev
```

## Notification Types

### 1. Domain Expiry Warning

Sent when a domain is expiring within 30 days.

**Severity Levels:**
- 🚨 **URGENT** (≤7 days): Red color, critical priority
- ⚠️ **WARNING** (8-30 days): Orange color, warning priority
- ℹ️ **NOTICE** (>30 days): Green color, informational

**Message Format:**
```
🚨 Domain Expiry Alert: example.com

Fields:
- Domain: example.com
- Days Until Expiry: 5 days
- Expiry Date: January 15, 2024
- Checked At: January 10, 2024, 10:30 AM
```

### 2. Domain Expired Alert

Sent when a domain has already expired.

**Message Format:**
```
🚨 CRITICAL: Domain Expired - example.com

Fields:
- Domain: example.com
- Status: EXPIRED
- Checked At: January 10, 2024, 10:30 AM
```

### 3. Bulk Domain Report

Summary report when multiple domains are expiring.

**Message Format:**
```
📊 Domain Expiry Report: 5 domains expiring soon

Fields:
- Total Expiring: 5
- Critical (≤7 days): 2
- Warning (8-30 days): 3

Domains:
• example.com - 5 days
• test.com - 10 days
• demo.com - 15 days
...and 2 more
```

## How It Works

### Automatic Checks

The system automatically checks all active domains every hour:

1. **Hourly Cron Job**: Runs at the top of every hour
2. **Random Delay**: 0-30 seconds initial delay to avoid bot detection
3. **Slow Checking**: 1-5 seconds delay between domain checks
4. **Notification Trigger**: Sends Slack alert if domain is expiring or expired

### Manual Trigger

You can also manually trigger domain checks via the API or queue dashboard.

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_SLACK_ALERTS` | Enable/disable Slack notifications | `false` | Yes |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | - | Yes (if enabled) |

### Alert Thresholds

Modify alert thresholds in the domain schema:

```typescript
// backend/src/domain/schemas/domain.schema.ts
@Prop({ default: 30 })
alertDaysBefore: number;
```

## Testing

### Test Slack Connection

Send a test notification to verify your setup:

```bash
# Using curl
curl -X POST http://localhost:8000/api/integrations/cloudflare/test
```

### Trigger Manual Check

Manually trigger a domain check to test notifications:

```bash
# Using the queue dashboard
# Visit: http://localhost:8000/admin/queues

# Or via API
curl -X POST http://localhost:8000/api/domain/check/example.com
```

## Troubleshooting

### No Notifications Received

1. **Check Environment Variables**
   ```bash
   # Verify settings are loaded
   echo $ENABLE_SLACK_ALERTS
   echo $SLACK_WEBHOOK_URL
   ```

2. **Verify Webhook URL**
   - Test webhook URL directly with curl:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test notification"}' \
     YOUR_WEBHOOK_URL
   ```

3. **Check Application Logs**
   ```bash
   # Look for Slack-related logs
   npm run start:dev | grep Slack
   ```

4. **Verify Domain Settings**
   - Ensure `enableExpiryAlerts` is `true` for the domain
   - Check that domain expiry dates are within threshold

### Notifications Not Working After Setup

1. **Restart Backend**: Changes to `.env` require restart
2. **Check Queue Status**: Visit http://localhost:8000/admin/queues
3. **Verify Domain Checks**: Look for domain check jobs in the queue

## API Integration

### SlackService Methods

```typescript
// Send domain expiry alert
await slackService.sendDomainExpiryAlert(
  domain: string,
  daysUntilExpiry: number,
  expiryDate: string
);

// Send domain expired alert
await slackService.sendDomainExpiredAlert(domain: string);

// Send bulk domain report
await slackService.sendBulkDomainReport(
  expiringDomains: Array<{ domain: string; daysUntilExpiry: number }>
);

// Check if Slack is enabled
const isEnabled = slackService.isEnabled();
```

## Best Practices

1. **Dedicated Channel**: Create a dedicated Slack channel for domain alerts (e.g., `#domain-alerts`)
2. **Alert Fatigue**: Adjust thresholds to avoid too many notifications
3. **Testing**: Test notifications in a test channel before production
4. **Monitoring**: Regularly review the queue dashboard for failed notifications
5. **Security**: Keep your webhook URL secure and never commit it to version control

## Advanced Configuration

### Custom Message Format

To customize notification messages, modify the SlackService:

```typescript
// backend/src/notifications/slack.service.ts
async sendDomainExpiryAlert(domain: string, daysUntilExpiry: number, expiryDate: string) {
  // Customize payload structure here
  const payload = {
    // Your custom message format
  };
}
```

### Multiple Webhooks

To send notifications to multiple channels, extend the SlackService to support multiple webhook URLs.

## Rate Limits

Slack API has rate limits:
- Standard: 1 message per second per webhook
- Burst: Up to 1000 messages per hour

The system automatically handles rate limiting by spacing out notifications during bulk checks.

## Security Notes

- **Webhook URL Security**: Keep webhook URLs in environment variables, never in code
- **Data Privacy**: Notifications contain domain names and expiry information
- **Access Control**: Limit access to the Slack channel to authorized personnel
- **Audit Logging**: All Slack notifications are logged in application logs

## Future Enhancements

- [ ] Interactive Slack buttons for quick actions
- [ ] Thread-based conversations for domain updates
- [ ] User mentions for specific domain owners
- [ ] Custom notification schedules per domain
- [ ] Slack slash commands for domain queries
- [ ] Integration with Slack workflows
