# Integrations Module

This module provides integration with 3rd party domain providers to import domains automatically.

## Features

- **Cloudflare Integration**: Import domains from Cloudflare zones
- **Credential Validation**: Validate API credentials before import
- **Bulk Import**: Import multiple domains at once
- **Provider Metadata**: Store provider-specific information
- **Import Summary**: Detailed import results with success/failure tracking

## Supported Providers

### Cloudflare

Import domains from Cloudflare zones using Global API Key.

**Required Credentials:**
- Email address
- Global API Key

**Imported Data:**
- Domain name
- Zone ID (as providerId)
- Status (active/inactive)
- Pause status
- Name servers
- Original name servers
- Original registrar
- Creation/modification dates

## API Endpoints

### Cloudflare Integration

#### Validate Credentials
```
POST /api/integrations/cloudflare/validate
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "apiKey": "your-global-api-key"
}
```

**Response:**
```json
{
  "valid": true,
  "userInfo": {
    "id": "user-id",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

#### Get Zones
```
POST /api/integrations/cloudflare/zones
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "apiKey": "your-global-api-key"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "domain": "example.com",
      "providerId": "zone-id",
      "status": "active",
      "isPaused": false,
      "nameServers": ["ns1.cloudflare.com", "ns2.cloudflare.com"],
      "originalNameServers": ["ns1.example.com", "ns2.example.com"],
      "originalRegistrar": "Example Registrar",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "modifiedAt": "2023-01-01T00:00:00.000Z",
      "activatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Import Domains
```
POST /api/integrations/cloudflare/import
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "apiKey": "your-global-api-key",
  "userId": "user-object-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "totalDomains": 5,
    "importedDomains": 3,
    "skippedDomains": 2,
    "errors": [],
    "importedDomainsList": ["example.com", "test.com", "demo.com"],
    "skippedDomainsList": [
      {
        "domain": "existing.com",
        "reason": "Domain already exists"
      },
      {
        "domain": "invalid.com",
        "reason": "Invalid domain format"
      }
    ]
  }
}
```

#### Get Provider Summary
```
GET /api/integrations/summary/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "byProvider": {
      "cloudflare": 7,
      "manual": 3,
      "other": 0
    }
  }
}
```

#### Test Connection
```
GET /api/integrations/cloudflare/test
```

**Response:**
```json
{
  "success": true,
  "message": "Cloudflare integration is available",
  "provider": "cloudflare",
  "version": "1.0.0"
}
```

## Domain Schema Updates

The domain schema has been extended to support 3rd party provider information:

```typescript
{
  // Existing fields...
  
  // 3rd Party Provider Information
  provider: string; // 'manual', 'cloudflare', 'godaddy', etc.
  providerId: string; // Provider's zone/domain ID
  providerStatus: string; // Provider-specific status
  isPaused: boolean; // For providers like Cloudflare
  nameServers: string[];
  originalNameServers: string[];
  originalRegistrar: string;
  activatedAt: Date; // When domain was activated on provider
  providerMetadata: Record<string, any>; // Additional provider-specific data
}
```

## Frontend Integration

### CloudflareImport Component

A React component that provides a step-by-step wizard for importing domains from Cloudflare:

1. **Credentials Step**: Enter email and API key
2. **Preview Step**: Review domains to be imported
3. **Results Step**: View import results

### Usage

```tsx
import CloudflareImport from './components/CloudflareImport';

<CloudflareImport
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={() => {
    // Refresh domains list
    fetchDomains();
  }}
  userId={currentUserId}
/>
```

### DomainMonitor Integration

The DomainMonitor component now includes an "Import from Cloudflare" button that opens the import wizard.

## Error Handling

The integration module includes comprehensive error handling:

- **Credential Validation**: Invalid credentials are caught and reported
- **API Errors**: Cloudflare API errors are properly handled and logged
- **Domain Conflicts**: Existing domains are skipped with appropriate messages
- **Network Issues**: Connection problems are handled gracefully

## Rate Limiting

All integration endpoints are protected by rate limiting to prevent abuse:
- 100 requests per minute per IP
- Throttling is applied using NestJS ThrottlerGuard

## Security Considerations

- API credentials are never stored permanently
- All requests are validated using class-validator
- Rate limiting prevents abuse
- Error messages don't expose sensitive information

## Future Enhancements

- **GoDaddy Integration**: Import domains from GoDaddy
- **Namecheap Integration**: Import domains from Namecheap
- **Bulk Operations**: Bulk update/delete imported domains
- **Sync Features**: Periodic sync with provider APIs
- **Webhook Support**: Real-time updates from providers 