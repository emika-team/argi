# Cloudflare Credentials Storage

This guide explains how to store and use Cloudflare API credentials for automatic domain imports and monitoring.

## Overview

The system now supports storing Cloudflare API credentials in the database, allowing for:
- ✅ One-time credential setup
- ✅ Automatic domain imports without re-entering credentials
- ✅ Secure storage of API tokens
- ✅ Per-user credential management

## Benefits

1. **Convenience**: Set up Cloudflare credentials once, use them for all future imports
2. **Automation**: Enable automatic domain synchronization
3. **Security**: Credentials are stored securely in the database, never logged
4. **User-specific**: Each user maintains their own Cloudflare credentials

## Setup Instructions

### 1. Get Your Cloudflare API Credentials

You have two options for authentication:

#### Option A: API Token (Recommended)
1. Log in to Cloudflare Dashboard
2. Go to **My Profile** > **API Tokens**
3. Click **Create Token**
4. Use the **Read all resources** template or create custom token with:
   - **Zone** → **Zone** → **Read**
   - **Zone** → **DNS** → **Read** (optional, for DNS records)
5. Copy the generated token
6. When using API Token, you can leave the email field empty

#### Option B: Global API Key (Legacy)
1. Log in to Cloudflare Dashboard
2. Go to **My Profile** > **API Tokens**
3. Scroll down to **Global API Key**
4. Click **View** and copy the key
5. You'll need both your Cloudflare account email and the API key

**Note**: API Tokens are more secure and recommended over Global API Keys.

### 2. Store Credentials via API

#### First-time setup with credentials:

```bash
curl -X POST http://localhost:8000/api/integrations/cloudflare/import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "email": "your-email@example.com",
    "apiKey": "your-api-token-or-key"
  }'
```

The system will:
1. Validate your credentials
2. Store them securely if valid
3. Import domains from Cloudflare
4. Remember credentials for future use

#### Subsequent imports (using stored credentials):

```bash
curl -X POST http://localhost:8000/api/integrations/cloudflare/import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID"
  }'
```

No need to provide credentials again! The system will use stored credentials.

### 3. Update User Settings

You can also update credentials separately via user settings:

```bash
curl -X PATCH http://localhost:8000/api/auth/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cloudflareEmail": "your-email@example.com",
    "cloudflareApiKey": "your-api-token-or-key"
  }'
```

### 4. Get Zones Using Stored Credentials

Fetch your Cloudflare zones without providing credentials each time:

```bash
curl -X GET http://localhost:8000/api/integrations/cloudflare/zones/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Endpoints

### Store/Update Credentials

**PATCH** `/api/auth/settings`
```json
{
  "cloudflareEmail": "user@example.com",
  "cloudflareApiKey": "your-api-token"
}
```

### Check Stored Credentials

**GET** `/api/auth/settings`

Response:
```json
{
  "telegramChatId": "123456789",
  "enableTelegramAlerts": true,
  "hasCloudflareCredentials": true,
  "cloudflareEmail": "user@example.com"
}
```

**Note**: The API key itself is never returned for security reasons.

### Import Domains

**POST** `/api/integrations/cloudflare/import`

With credentials (first time):
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "apiKey": "your-api-token"
}
```

Without credentials (uses stored):
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

### Get Zones

**GET** `/api/integrations/cloudflare/zones/:userId`

Uses stored credentials automatically.

### Validate Credentials

**POST** `/api/integrations/cloudflare/validate`
```json
{
  "email": "user@example.com",
  "apiKey": "your-api-token"
}
```

## Security Best Practices

### 1. API Token Permissions
When creating an API Token, use the principle of least privilege:
- Only grant **Read** permissions if you only need to import domains
- Create separate tokens for different purposes
- Set IP restrictions if possible
- Set token expiration dates

### 2. Credential Storage
- Credentials are stored in MongoDB with the user document
- API keys are never logged or exposed in API responses
- Always use HTTPS in production
- Rotate credentials periodically

### 3. Access Control
- Only the authenticated user can access their own credentials
- JWT tokens are required for all credential operations
- Implement rate limiting on API endpoints

## Examples

### Complete Setup Flow

1. **Register and login:**
```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

2. **Store Cloudflare credentials:**
```bash
curl -X PATCH http://localhost:8000/api/auth/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cloudflareEmail": "",
    "cloudflareApiKey": "your-cloudflare-api-token"
  }'
```

3. **Import domains:**
```bash
curl -X POST http://localhost:8000/api/integrations/cloudflare/import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID"
  }'
```

### Using API Token (No Email Required)

Modern approach using API Token:

```bash
curl -X PATCH http://localhost:8000/api/auth/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cloudflareEmail": "",
    "cloudflareApiKey": "ABCdefGHIjklMNOpqrsTUVwxyz1234567890"
  }'
```

The system automatically detects API tokens (40+ characters) and uses Bearer authentication.

### Using Global API Key

Legacy approach with Global API Key:

```bash
curl -X PATCH http://localhost:8000/api/auth/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cloudflareEmail": "user@example.com",
    "cloudflareApiKey": "your-global-api-key-37-chars"
  }'
```

## Troubleshooting

### Invalid Credentials Error

**Problem**: Getting "Invalid Cloudflare credentials" error

**Solutions**:
1. Verify your API token/key is correct
2. Check token hasn't expired
3. Ensure token has correct permissions (at minimum: Zone:Read)
4. For API tokens, make sure email field is empty or omitted
5. For Global API Key, provide both email and key

### Credentials Not Found

**Problem**: "No Cloudflare credentials stored for this user"

**Solutions**:
1. Store credentials first using `/api/auth/settings`
2. Verify you're using the correct user ID
3. Check authentication token is valid

### Import Fails After Storing Credentials

**Problem**: Credentials stored but import still fails

**Solutions**:
1. Test credentials using `/api/integrations/cloudflare/validate`
2. Check Cloudflare API status
3. Verify network connectivity
4. Review backend logs for detailed error messages

## Migration from Old System

If you were previously providing credentials on each request:

**Old way** (still supported):
```bash
curl -X POST http://localhost:8000/api/integrations/cloudflare/import \
  -d '{
    "userId": "USER_ID",
    "email": "user@example.com",
    "apiKey": "token"
  }'
```

**New way** (recommended):
```bash
# Store once
curl -X PATCH http://localhost:8000/api/auth/settings \
  -d '{"cloudflareEmail": "", "cloudflareApiKey": "token"}'

# Use many times
curl -X POST http://localhost:8000/api/integrations/cloudflare/import \
  -d '{"userId": "USER_ID"}'
```

## Database Schema

Credentials are stored in the User document:

```javascript
{
  "_id": ObjectId("..."),
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  // ... other user fields
  "cloudflareEmail": "user@cloudflare.com",  // Can be empty for API tokens
  "cloudflareApiKey": "encrypted-api-key"     // Stored securely
}
```

## Future Enhancements

Planned improvements:
- [ ] Credential encryption at rest
- [ ] Multiple credential sets per user
- [ ] Automatic credential expiry notifications
- [ ] Integration with Cloudflare webhooks
- [ ] Automatic domain sync on schedule

## Related Documentation

- [CLOUDFLARE_AUTH.md](./CLOUDFLARE_AUTH.md) - Cloudflare authentication details
- [DOMAIN_API.md](./DOMAIN_API.md) - Domain API endpoints
- [INTEGRATIONS.md](./INTEGRATIONS.md) - Integration overview
- [TELEGRAM_NOTIFICATIONS.md](./TELEGRAM_NOTIFICATIONS.md) - Telegram setup

## Support

For help:
- Check Cloudflare API documentation: https://developers.cloudflare.com/api/
- Review application logs for detailed errors
- Open an issue on GitHub with error details
