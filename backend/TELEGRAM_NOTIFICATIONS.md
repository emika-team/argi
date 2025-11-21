# Telegram Notifications Setup Guide

This guide explains how to set up Telegram notifications for domain expiry alerts in the Uptime & Domain Monitor system.

## Features

- 🔔 Real-time Telegram notifications for expiring domains
- ⚠️ Automatic alerts when domains are expiring soon (30 days or custom threshold)
- 🚨 Critical alerts for expired domains
- 📊 Bulk domain expiry summaries
- ⏰ Configurable per-user notification preferences

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command to BotFather
3. Follow the prompts to create your bot:
   - Choose a name for your bot (e.g., "Domain Monitor Bot")
   - Choose a username for your bot (must end in 'bot', e.g., "domain_monitor_bot")
4. BotFather will give you a **Bot Token** - save this for later
   - Example: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-123456789`

### 2. Get Your Chat ID

You need your Telegram Chat ID to receive notifications:

**Option A: Using @userinfobot**
1. Search for `@userinfobot` in Telegram
2. Start a chat with it
3. It will reply with your user information including your Chat ID
4. Your Chat ID will be a number like `123456789`

**Option B: Using @getidsbot**
1. Search for `@getidsbot` in Telegram
2. Start a chat with it
3. Send any message
4. It will reply with your Chat ID

**Option C: Manual method**
1. Send a message to your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789}` in the response

### 3. Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-123456789
ENABLE_TELEGRAM_ALERTS=true
```

### 4. Restart the Backend

```bash
cd backend
npm run start:dev
```

Or if using Docker:
```bash
docker-compose restart backend
```

### 5. Configure User Settings

#### Using the API

**Update your user settings to enable Telegram:**

```bash
curl -X PATCH http://localhost:8000/api/auth/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telegramChatId": "123456789",
    "enableTelegramAlerts": true
  }'
```

**Test the connection:**

```bash
curl -X POST http://localhost:8000/api/notifications/telegram/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "123456789"
  }'
```

If successful, you should receive a test message in Telegram!

### 6. Verify Setup

**Check Telegram service status:**

```bash
curl http://localhost:8000/api/notifications/telegram/status
```

**Get your current settings:**

```bash
curl http://localhost:8000/api/auth/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notification Types

### Single Domain Alert

Sent when a specific domain is expiring soon or has expired:

```
⚠️ Domain EXPIRING SOON

Domain: example.com
Days Until Expiry: 15
Expiry Date: 12/25/2024
⚠️ Action required soon!
```

### Bulk Domain Alert

Sent for multiple expiring domains at once:

```
⚠️ Domain Expiry Summary

⚠️ example1.com
   Days: 7 | Expires: 12/18/2024

🚨 example2.com
   Days: -2 | Expires: 12/09/2024

⏰ example3.com
   Days: 20 | Expires: 12/31/2024
```

## Alert Thresholds

- 🚨 **Expired** (Days < 0): Critical alert with red emoji
- ⚠️ **Critical** (Days ≤ 7): Warning alert with yellow emoji
- ⏰ **Warning** (Days ≤ 30): Reminder alert with clock emoji

## Customization

### Per-Domain Alert Settings

You can customize alert settings per domain in the database:

```javascript
{
  "domain": "example.com",
  "enableExpiryAlerts": true,    // Enable/disable alerts for this domain
  "alertDaysBefore": 30           // Alert when X days before expiry
}
```

### Per-User Alert Settings

Each user can control their notification preferences:

```javascript
{
  "enableTelegramAlerts": true,  // Master switch for Telegram
  "telegramChatId": "123456789"  // Where to send alerts
}
```

## Troubleshooting

### Bot not responding
1. Check that your `TELEGRAM_BOT_TOKEN` is correct
2. Verify `ENABLE_TELEGRAM_ALERTS=true` in `.env`
3. Restart the backend service
4. Check backend logs for errors

### Not receiving notifications
1. Verify your `telegramChatId` is correct
2. Ensure you've started a conversation with the bot (send `/start`)
3. Check that `enableTelegramAlerts` is `true` in your user settings
4. Verify domain has `enableExpiryAlerts: true`

### Testing notifications
Use the test endpoint to verify everything is working:

```bash
curl -X POST http://localhost:8000/api/notifications/telegram/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chatId": "YOUR_CHAT_ID"}'
```

### Check service status

```bash
# Backend logs
cd backend
npm run start:dev

# Docker logs
docker-compose logs -f backend

# Check Telegram service status
curl http://localhost:8000/api/notifications/telegram/status
```

## Security Considerations

1. **Keep your bot token secret** - Never commit it to version control
2. **Use environment variables** - Always store tokens in `.env` files
3. **Validate chat IDs** - Only send notifications to verified users
4. **Rate limiting** - The system uses rate limiting to prevent abuse
5. **User privacy** - Chat IDs are stored securely in the database

## API Endpoints

### Notifications
- `POST /api/notifications/telegram/test` - Test Telegram connection
- `GET /api/notifications/telegram/status` - Check if Telegram is enabled

### User Settings
- `GET /api/auth/settings` - Get user settings
- `PATCH /api/auth/settings` - Update user settings

### Example: Update settings
```bash
curl -X PATCH http://localhost:8000/api/auth/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telegramChatId": "123456789",
    "enableTelegramAlerts": true
  }'
```

## Advanced Configuration

### Custom Alert Messages

To customize alert messages, edit `/backend/src/notifications/telegram.service.ts`:

```typescript
const message = `
${emoji} *Domain ${status}*

*Domain:* ${domain}
*Days Until Expiry:* ${daysUntilExpiry}
*Expiry Date:* ${expiryDate.toLocaleDateString()}
// Add your custom fields here
`.trim();
```

### Multiple Telegram Bots

You can use different bots for different environments:

```env
# Development
TELEGRAM_BOT_TOKEN=1234567890:DEV_TOKEN
ENABLE_TELEGRAM_ALERTS=true

# Production
TELEGRAM_BOT_TOKEN=9876543210:PROD_TOKEN
ENABLE_TELEGRAM_ALERTS=true
```

### Group Notifications

To send notifications to a Telegram group:
1. Add your bot to the group
2. Make the bot an admin (optional, but recommended)
3. Get the group Chat ID (will be negative, like `-987654321`)
4. Use the group Chat ID in your settings

```bash
curl -X PATCH http://localhost:8000/api/auth/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telegramChatId": "-987654321",
    "enableTelegramAlerts": true
  }'
```

## Next Steps

- Set up Cloudflare integration to automatically monitor your domains
- Configure email alerts as a backup notification channel
- Customize alert thresholds per domain
- Set up domain monitoring queues for automatic checks

## Support

For issues or questions:
- Check the main [README.md](../README.md) for general setup
- Review [DOMAIN_MONITORING.md](./DOMAIN_MONITORING.md) for domain monitoring details
- Open an issue on GitHub
