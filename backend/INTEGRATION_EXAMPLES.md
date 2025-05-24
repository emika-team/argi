# Integration Examples

This document provides examples of how to use the integrations module.

## Cloudflare Integration Examples

### 1. Test Connection

```bash
curl -X GET http://localhost:8000/api/integrations/cloudflare/test
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

### 2. Validate Credentials

```bash
curl -X POST http://localhost:8000/api/integrations/cloudflare/validate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "apiKey": "your-global-api-key"
  }'
```

**Success Response:**
```json
{
  "valid": true,
  "userInfo": {
    "id": "abc123",
    "email": "your-email@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "telephone": null,
    "country": "US",
    "zipcode": "12345"
  }
}
```

**Error Response:**
```json
{
  "valid": false
}
```

### 3. Get Cloudflare Zones

```bash
curl -X POST http://localhost:8000/api/integrations/cloudflare/zones \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "apiKey": "your-global-api-key"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "domain": "example.com",
      "provider": "cloudflare",
      "providerId": "abc123def456",
      "status": "active",
      "isPaused": false,
      "nameServers": [
        "ns1.cloudflare.com",
        "ns2.cloudflare.com"
      ],
      "originalNameServers": [
        "ns1.example.com",
        "ns2.example.com"
      ],
      "originalRegistrar": "Example Registrar Inc.",
      "createdAt": "2023-01-15T10:30:00.000Z",
      "modifiedAt": "2023-06-20T14:45:00.000Z",
      "activatedAt": "2023-01-15T11:00:00.000Z"
    },
    {
      "domain": "test.com",
      "provider": "cloudflare",
      "providerId": "def456ghi789",
      "status": "active",
      "isPaused": true,
      "nameServers": [
        "ns3.cloudflare.com",
        "ns4.cloudflare.com"
      ],
      "originalNameServers": [
        "ns1.test.com",
        "ns2.test.com"
      ],
      "originalRegistrar": "Test Registrar LLC",
      "createdAt": "2023-03-10T08:15:00.000Z",
      "modifiedAt": "2023-07-01T16:20:00.000Z",
      "activatedAt": "2023-03-10T09:00:00.000Z"
    }
  ],
  "count": 2
}
```

### 4. Import Domains from Cloudflare

```bash
curl -X POST http://localhost:8000/api/integrations/cloudflare/import \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "apiKey": "your-global-api-key",
    "userId": "507f1f77bcf86cd799439011"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "totalDomains": 3,
    "importedDomains": 2,
    "skippedDomains": 1,
    "errors": [],
    "importedDomainsList": [
      "example.com",
      "test.com"
    ],
    "skippedDomainsList": [
      {
        "domain": "existing.com",
        "reason": "Domain already exists"
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid Cloudflare credentials"
}
```

### 5. Get Provider Summary

```bash
curl -X GET http://localhost:8000/api/integrations/summary/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "byProvider": {
      "cloudflare": 10,
      "manual": 5,
      "other": 0
    }
  }
}
```

## Frontend Integration Examples

### 1. Using CloudflareImport Component

```tsx
import React, { useState } from 'react';
import { Button } from '@mui/material';
import CloudflareImport from './components/CloudflareImport';

const DomainManagement: React.FC = () => {
  const [importOpen, setImportOpen] = useState(false);
  const [userId] = useState('507f1f77bcf86cd799439011'); // Get from auth context

  const handleImportSuccess = () => {
    // Refresh domains list
    console.log('Domains imported successfully!');
    // Call your domain refresh function here
  };

  return (
    <div>
      <Button 
        variant="contained" 
        onClick={() => setImportOpen(true)}
      >
        Import from Cloudflare
      </Button>

      <CloudflareImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={handleImportSuccess}
        userId={userId}
      />
    </div>
  );
};
```

### 2. Using the Hook Directly

```tsx
import React, { useState } from 'react';
import { useCloudflareImport } from '../hooks/useCloudflareImport';

const CustomImport: React.FC = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    apiKey: ''
  });

  const {
    loading,
    error,
    zones,
    importResult,
    validateCredentials,
    fetchZones,
    importDomains,
    reset
  } = useCloudflareImport();

  const handleValidate = async () => {
    const result = await validateCredentials(credentials);
    if (result.valid) {
      console.log('Credentials valid!', result.userInfo);
      await fetchZones(credentials);
    }
  };

  const handleImport = async () => {
    const result = await importDomains({
      ...credentials,
      userId: 'your-user-id'
    });
    
    if (result) {
      console.log('Import completed:', result);
    }
  };

  return (
    <div>
      {/* Your custom UI here */}
      <input 
        value={credentials.email}
        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
        placeholder="Email"
      />
      <input 
        value={credentials.apiKey}
        onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
        placeholder="API Key"
        type="password"
      />
      
      <button onClick={handleValidate} disabled={loading}>
        Validate & Fetch Zones
      </button>
      
      {zones.length > 0 && (
        <button onClick={handleImport} disabled={loading}>
          Import {zones.length} Domains
        </button>
      )}
      
      {error && <div>Error: {error}</div>}
      {importResult && <div>Imported: {importResult.importedDomains}</div>}
    </div>
  );
};
```

## Error Handling Examples

### 1. Invalid Credentials

**Request:**
```bash
curl -X POST http://localhost:8000/api/integrations/cloudflare/validate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@example.com",
    "apiKey": "invalid-key"
  }'
```

**Response:**
```json
{
  "valid": false
}
```

### 2. Network Error

**Request:**
```bash
curl -X POST http://localhost:8000/api/integrations/cloudflare/zones \
  -H "Content-Type: application/json" \
  -d '{
    "email": "valid@example.com",
    "apiKey": "valid-but-network-fails"
  }'
```

**Response:**
```json
{
  "statusCode": 400,
  "message": "Failed to connect to Cloudflare API",
  "error": "Bad Request"
}
```

### 3. Rate Limiting

**Request:** (After exceeding rate limit)
```bash
curl -X POST http://localhost:8000/api/integrations/cloudflare/validate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "apiKey": "api-key"
  }'
```

**Response:**
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests"
}
```

## Testing with Postman

### Collection Setup

1. Create a new Postman collection called "Domain Integrations"
2. Set base URL variable: `{{baseUrl}}` = `http://localhost:8000/api`
3. Add the following requests:

#### Environment Variables
```json
{
  "baseUrl": "http://localhost:8000/api",
  "cloudflareEmail": "your-email@example.com",
  "cloudflareApiKey": "your-global-api-key",
  "userId": "507f1f77bcf86cd799439011"
}
```

#### Request Collection
1. **Test Connection**: `GET {{baseUrl}}/integrations/cloudflare/test`
2. **Validate Credentials**: `POST {{baseUrl}}/integrations/cloudflare/validate`
3. **Get Zones**: `POST {{baseUrl}}/integrations/cloudflare/zones`
4. **Import Domains**: `POST {{baseUrl}}/integrations/cloudflare/import`
5. **Provider Summary**: `GET {{baseUrl}}/integrations/summary/{{userId}}`

## Common Issues and Solutions

### 1. "Invalid Cloudflare credentials"
- Verify email and API key are correct
- Ensure you're using Global API Key, not API Token
- Check if API key has proper permissions

### 2. "Failed to connect to Cloudflare API"
- Check internet connection
- Verify Cloudflare API is accessible
- Check for firewall restrictions

### 3. "Domain already exists"
- This is expected behavior for existing domains
- Check the skippedDomainsList in import results
- Domains are skipped to prevent duplicates

### 4. "Invalid user ID format"
- Ensure userId is a valid MongoDB ObjectId
- Use proper user authentication in production

### 5. Rate limiting errors
- Wait before retrying requests
- Implement proper retry logic with exponential backoff
- Consider caching results when possible 