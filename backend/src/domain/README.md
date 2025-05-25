# Domain Monitoring System - Individual Queue Architecture

## Overview

This system has been refactored to use **1 domain = 1 queue** architecture instead of a single shared queue. Each domain now has its own dedicated queue for monitoring, providing better isolation, scalability, and granular control.

## Architecture Changes

### Before (Single Queue)
- All domains shared one queue: `domain-monitoring`
- Jobs: `check-all-domains`, `check-user-domains`, `check-single-domain`
- One processor handling all domain types

### After (Individual Queues)
- Each domain gets its own queue: `domain-monitoring-{sanitized-domain-name}`
- Jobs: `check-domain-expiry` (one type per queue)
- Dynamic processor creation per domain

## Key Components

### 1. DomainQueueService
- **Dynamic Queue Creation**: Creates individual queues for each domain
- **Queue Management**: Setup, pause, resume, clear, remove per domain
- **Processor Registration**: Registers job processors for each queue
- **Monitoring Setup**: Configurable monitoring intervals per domain

### 2. DomainProcessorFactory
- **Processor Management**: Creates and manages processors for each domain
- **Job Processing**: Handles `check-domain-expiry` jobs
- **Cleanup**: Removes processors when domains are deleted

### 3. Updated API Endpoints

#### Domain Management
```bash
# Add domain (automatically sets up monitoring)
POST /domain/user/{userId}/domains
{
  "domain": "example.com"
}

# Remove domain (automatically removes monitoring)
DELETE /domain/user/{userId}/domains/{domain}
```

#### Queue Management
```bash
# Get stats for all domain queues
GET /domain/queue/stats

# Get stats for specific domain queue
GET /domain/queue/stats/{domain}

# Setup monitoring for all user domains
POST /domain/queue/setup-user-monitoring/{userId}

# Pause/Resume/Clear specific domain queue
POST /domain/queue/pause/{domain}
POST /domain/queue/resume/{domain}
POST /domain/queue/clear/{domain}

# Remove monitoring for specific domain
DELETE /domain/queue/remove/{domain}

# Get list of active domains with monitoring
GET /domain/queue/active-domains
```

## Benefits

### 1. **Isolation**
- Domain failures don't affect other domains
- Individual queue health monitoring
- Independent scaling per domain

### 2. **Granular Control**
- Different monitoring intervals per domain
- Domain-specific queue management
- Individual pause/resume capabilities

### 3. **Better Performance**
- Parallel processing of domain checks
- No queue blocking from problematic domains
- Reduced contention

### 4. **Improved Monitoring**
- Domain-specific metrics
- Clear queue ownership
- Better error tracking

## Usage Examples

### Adding a Domain with Monitoring
```typescript
// Domain is automatically added with 60-minute monitoring interval
const domain = await domainService.addDomainToUser(userId, { domain: 'example.com' });
// Queue: domain-monitoring-example-com is created
```

### Manual Queue Setup
```typescript
// Setup custom monitoring interval (30 minutes)
await domainQueueService.setupDomainMonitoring('example.com', domainId, 30);
```

### Queue Management
```typescript
// Get stats for specific domain
const stats = await domainQueueService.getDomainQueueStats('example.com');

// Pause monitoring for domain
await domainQueueService.pauseDomainQueue('example.com');

// Remove all monitoring for domain
await domainQueueService.removeDomainMonitoring('example.com');
```

## Migration Notes

- **Automatic**: New domains automatically get individual queues
- **Existing Domains**: Use `POST /domain/queue/setup-user-monitoring/{userId}` to setup monitoring for existing domains
- **Legacy Endpoints**: Still supported for backward compatibility
- **Queue Names**: Domain names are sanitized (dots become dashes) for queue names

## Configuration

### Default Settings
- **Monitoring Interval**: 60 minutes
- **Queue Options**: 
  - `removeOnComplete: 10`
  - `removeOnFail: 50`
- **Redis Connection**: Uses environment variables:
  - `REDIS_HOST` (default: localhost)
  - `REDIS_PORT` (default: 6379) 
  - `REDIS_PASSWORD` (optional)

### Environment Variables
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_if_needed
```

## Monitoring and Debugging

### Queue Stats
```bash
curl GET /domain/queue/stats
# Returns overview of all domain queues

curl GET /domain/queue/stats/example.com  
# Returns detailed stats for specific domain
```

### Active Domains
```bash
curl GET /domain/queue/active-domains
# Lists all domains with active monitoring
```

### Manual Trigger
```bash
curl POST /domain/queue/check-domain -H "Content-Type: application/json" -d '{"domain":"example.com","domainId":"..."}'
# Manually trigger domain check
``` 