# Domain Monitoring Setup Guide

## Summary of API Updates

The domain monitoring system has been updated to use the new enhanced API endpoints instead of the legacy ones. Key changes:

### ✅ What's Fixed
1. **New API Endpoints**: Using `/domain/user/:userId/domains` instead of legacy `/domain/list/:userId`
2. **Proper Authentication**: Now uses authenticated user IDs from localStorage
3. **Enhanced Features**: Support for domain metadata, alerts settings, and better error handling
4. **No More "Default" User**: Removed hardcoded "default" userId dependency

### 🔧 New Features
- Domain descriptions and tags
- Customizable expiry alerts
- Better error messages
- Improved authentication handling

## Setup Instructions

### 1. Backend Setup

First, ensure your backend has the required environment variables:

```bash
cp .env.example .env
```

Edit `.env` and set:
```env
MONGODB_URI=mongodb://localhost:27017/uptime-monitor
JWT_SECRET=your-secret-key-here
```

### 2. Run Database Migration

Create a default user and sample domains:

```bash
cd backend
npm run migrate-domains
```

This creates:
- Default user: `admin@example.com` / `admin123`
- Sample domains: google.com, github.com, stackoverflow.com

### 3. Start the Application

Backend:
```bash
cd backend
npm run start:dev
```

Frontend:
```bash
cd frontend
npm start
```

### 4. Login and Test

1. Go to `http://localhost:3000`
2. Login with: `admin@example.com` / `admin123`
3. Navigate to Dashboard
4. The Domain Monitoring section should load with sample domains

## API Endpoints Reference

### New Enhanced Endpoints
- `GET /domain/user/:userId/domains` - Get user domains
- `POST /domain/user/:userId/domains` - Add domain
- `DELETE /domain/user/:userId/domains/:domain` - Remove domain
- `PUT /domain/user/:userId/domains/:domain` - Update domain
- `GET /domain/user/:userId/domains/:domain/check` - Check specific domain

### Legacy Endpoints (Still Supported)
- `GET /domain/list/:userId` - Get domains (simple)
- `POST /domain/add` - Add domain (simple)
- `DELETE /domain/:userId/:domain` - Remove domain (simple)

## Error Handling

The system now handles authentication errors gracefully:
- **Not logged in**: Shows "Please log in to view your domains"
- **Invalid user**: Shows proper error messages
- **Network issues**: Fallback to cached data when possible

## Development Notes

- User authentication is required for all domain operations
- UserID is automatically extracted from the authenticated user's session
- No more temporary or hardcoded user IDs
- Better TypeScript type safety throughout

## Troubleshooting

### "User not authenticated" Error
Make sure you're logged in and have a valid token in localStorage.

### "Invalid user ID format" Error
The backend requires valid MongoDB ObjectId format. This should be handled automatically by the auth system.

### Domains Not Loading
1. Check if you're logged in
2. Verify backend is running on port 8000
3. Check network tab for API errors
4. Run the migration script to create sample data

### Adding New Users

You can register new users through the `/register` page or create them programmatically:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
``` 