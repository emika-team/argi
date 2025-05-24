# Uptime Monitor Backend

NestJS backend application for monitoring uptime and domain expiry with Bull Queue integration.

## Features

- **Domain Monitoring**: Automated domain expiry checking every 5 minutes using Bull Queue
- **Uptime Monitoring**: Website uptime monitoring
- **SSL Certificate Monitoring**: SSL certificate expiry tracking
- **User Authentication**: JWT-based authentication system
- **Notification System**: Email alerts for expiring domains
- **Queue Management**: Bull Queue with Redis for reliable job processing
- **Admin Dashboard**: Bull Board integration for queue monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB
- Redis

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with:
# - MongoDB connection string
# - Redis connection details
# - JWT secret
# - SMTP configuration (optional)
```

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/uptime-monitor
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key-here
PORT=3000
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Testing Domain Queue System

```bash
# Test the domain monitoring queue
npm run test-domain-queue
```

## Domain Monitoring with Bull Queue

The system automatically checks all active domains every 5 minutes using Bull Queue. Key features:

- **Automated Checks**: All domains are checked every 5 minutes
- **Individual Triggers**: Manual checks for specific domains or users
- **Queue Management**: Pause, resume, and monitor queue operations
- **Visual Dashboard**: Bull Board at `/admin/queues`

### API Endpoints

#### Domain Management
```
GET    /domain/check/:domain              - Check single domain
GET    /domain/user/:userId/domains       - Get user domains
POST   /domain/user/:userId/domains       - Add domain to user
PUT    /domain/user/:userId/domains/:domain - Update domain
DELETE /domain/user/:userId/domains/:domain - Remove domain
```

#### Queue Management
```
GET    /domain/queue/stats              - Queue statistics
POST   /domain/queue/check-all          - Trigger all domains check
POST   /domain/queue/check-user/:userId - Trigger user domains check
POST   /domain/queue/check-domain       - Trigger single domain check
POST   /domain/queue/pause              - Pause queue
POST   /domain/queue/resume             - Resume queue
POST   /domain/queue/clear              - Clear queue
```

### Bull Board Dashboard

Access the queue monitoring dashboard at: `http://localhost:3000/admin/queues`

Features:
- View active, waiting, completed, and failed jobs
- Retry failed jobs manually
- Monitor queue performance and statistics
- Real-time updates

## Documentation

- [Domain Monitoring with Bull Queue](./DOMAIN_MONITORING.md) - Detailed documentation
- [API Documentation](./DOMAIN_API.md) - API reference

## Architecture

```
├── src/
│   ├── domain/                 # Domain monitoring module
│   │   ├── domain.service.ts      # Core domain logic
│   │   ├── domain.processor.ts    # Bull queue processor
│   │   ├── domain-queue.service.ts # Queue management
│   │   ├── domain.scheduler.ts    # Backup scheduler
│   │   └── domain.controller.ts   # REST API endpoints
│   ├── auth/                   # Authentication module
│   ├── monitors/               # Uptime monitoring
│   ├── ssl/                    # SSL monitoring
│   ├── notifications/          # Email notifications
│   └── bull-board/            # Queue dashboard
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test domain queue specifically
npm run test-domain-queue
```

### Linting

```bash
npm run lint
```

## Production Deployment

1. Build the application: `npm run build`
2. Set production environment variables
3. Ensure MongoDB and Redis are running
4. Start with: `npm run start:prod`

### Docker Deployment

```bash
# Build image
docker build -t uptime-monitor-backend .

# Run with docker-compose (recommended)
docker-compose up -d
```

## Monitoring and Troubleshooting

### Queue Issues

- Check Redis connection
- Monitor queue via Bull Board dashboard
- Use queue management API endpoints
- Check application logs

### Domain Check Issues

- Verify external WHOIS service availability
- Check domain format validation
- Monitor failed jobs in Bull Board
- Use manual triggers for testing

## License

MIT 