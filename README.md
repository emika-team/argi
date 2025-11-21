# 🎯 Uptime & Domain Monitor

A comprehensive full-stack monitoring system for tracking website uptime, domain expiration, and SSL certificates. Built with NestJS, React, MongoDB, and Redis.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 About the Project

A complete monitoring solution for tracking website uptime, domain expiration dates, and SSL certificates. Designed to provide real-time status updates and automated checks with a beautiful dashboard interface

## ✨ Features

### 🔍 Uptime Monitoring
- ✅ Real-time website status checks
- ⏱️ Response time measurement
- 📊 Multiple protocol support (HTTP/HTTPS/PING/TCP)
- � Historical data tracking
- �🔔 Automated alerts on failures

### 🌐 Domain Monitoring
- 📅 Domain expiration date tracking via WHOIS
- ⚠️ Automated alerts before expiration
- ☁️ Cloudflare integration for bulk import
- � Automatic checks every 60 minutes
- 📋 Comprehensive domain list management

### 🔒 SSL Certificate Monitoring
- � SSL certificate expiration tracking
- 🔒 Security validation
- 📊 Certificate details viewing

### 📱 Dashboard & Reporting
- 📈 Real-time dashboard with statistics
- � Visual charts and graphs
- � Detailed history logs
- 📧 Email/notification system
- 🎯 Queue monitoring with Bull Board

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: MongoDB with Mongoose
- **Cache & Queue**: Redis + Bull
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **API Docs**: Swagger/OpenAPI
- **WebSockets**: Socket.IO
- **Task Scheduling**: node-cron

### Frontend
- **Framework**: React 18 (TypeScript)
- **UI Library**: Material-UI (MUI)
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Forms**: React Hook Form + Yup
- **Charts**: Chart.js + react-chartjs-2

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Bull Board

### External Services
- **WHOIS**: Domain expiry lookups
- **Cloudflare API**: Domain import with stored credentials
- **Email**: Nodemailer (SMTP)
- **Telegram**: Bot API for notifications

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose** installed and running
- **Node.js** 18+ and **npm** (for local development)
- **Git**

### Development Setup (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd argi
```

2. **Setup and start everything**
```bash
chmod +x dev.sh
./dev.sh setup    # First time: setup infrastructure & install dependencies
./dev.sh start    # Start all services
```

3. **Access the application**
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/api/docs
- 📊 Queue Dashboard: http://localhost:8000/admin/queues

### Alternative: Full Docker Setup

```bash
# Start all services (including backend and frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Note**: The full Docker setup is for production. For development, use the scripts above for better hot-reload experience.

## 📊 Usage Guide

### Adding a New Monitor
1. Navigate to "Monitors" page
2. Click "Add New Monitor"
3. Enter website URL
4. Select monitor type (HTTP/HTTPS/TCP/PING)
5. Set check interval
6. Save the monitor

### Viewing Dashboard
- **Overview**: Overall system status
- **Uptime Stats**: Uptime statistics and trends
- **Response Time**: Response time graphs
- **SSL Monitor**: SSL certificate status
- **Domain Expiry**: Domain expiration tracking

### Configuring Cloudflare Integration
1. Go to "Integrations" page
2. Click "Cloudflare Import"
3. Enter your Cloudflare API credentials
4. Select zones to import
5. Import domains

### Setting Up Alerts
1. Navigate to "Settings"
2. Configure email SMTP settings
3. Set up Telegram bot notifications (optional) - See [TELEGRAM_NOTIFICATIONS.md](./backend/TELEGRAM_NOTIFICATIONS.md)
4. Set alert thresholds
5. Test notification delivery

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)
```env
# Database
MONGODB_URI=mongodb://admin:password123@localhost:27017/monitor_db?authSource=admin
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NODE_ENV=development
PORT=8000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=7d

# Email (optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ENABLE_EMAIL_ALERTS=false

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
ENABLE_TELEGRAM_ALERTS=false

# Monitoring
DEFAULT_CHECK_INTERVAL=60
SSL_CHECK_INTERVAL=86400
DOMAIN_CHECK_INTERVAL=3600       # Domain checks every hour (3600 seconds)
MAX_RETRIES=3
TIMEOUT=30000
```

#### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000
PORT=3000
```

### Advanced Configuration

#### Custom Check Intervals
Modify intervals in `backend/.env`:
```env
DEFAULT_CHECK_INTERVAL=60        # Uptime checks (seconds)
DOMAIN_CHECK_INTERVAL=3600       # Domain checks (seconds)
SSL_CHECK_INTERVAL=86400         # SSL checks (seconds)
```

#### Queue Configuration
Bull queues are configured in `backend/src/domain/domain-queue.service.ts`:
- Individual queues per domain
- Automatic retry on failure
- Job cleanup after completion

## 📈 API Documentation

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

#### Monitors
- `GET /api/monitors` - List all monitors
- `POST /api/monitors` - Create new monitor
- `GET /api/monitors/:id` - Get monitor details
- `PATCH /api/monitors/:id` - Update monitor
- `DELETE /api/monitors/:id` - Delete monitor
- `GET /api/monitors/:id/stats` - Get monitor statistics
- `POST /api/monitors/bulk-check` - Trigger bulk check

#### Domains
- `GET /api/domain/check/:domain` - Check domain expiry
- `POST /api/domain/add` - Add domain to monitoring
- `GET /api/domain/user/:userId/domains` - List user domains
- `DELETE /api/domain/:userId/:domain` - Remove domain
- `GET /api/domain/expiring` - Get expiring domains
- `GET /api/domain/queue/stats` - Get queue statistics

#### Integrations
- `POST /api/integrations/cloudflare/validate` - Validate Cloudflare credentials
- `POST /api/integrations/cloudflare/zones` - Fetch Cloudflare zones
- `POST /api/integrations/cloudflare/import` - Import domains from Cloudflare
- `GET /api/integrations/summary/:userId` - Get integration summary

#### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Authentication Example
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -X GET http://localhost:8000/api/monitors
```

### Interactive API Docs
Visit http://localhost:8000/api/docs for complete interactive Swagger documentation.

## 🔐 Security Features

- 🔑 JWT-based authentication
- 🛡️ Rate limiting with Throttler
- 🔒 Password hashing with bcrypt
- 🌐 CORS configuration
- ✅ Input validation with class-validator
- 🔐 Environment variable management
- 📝 Audit logging

## 🐛 Troubleshooting

### Common Issues

**Q: Cannot connect to MongoDB**
```bash
# Check MongoDB status
docker ps | grep mongodb
docker logs monitor_mongodb

# Restart MongoDB
docker-compose restart mongodb
```

**Q: Cannot connect to Redis**
```bash
# Test Redis connection
docker exec monitor_redis redis-cli ping

# Should return: PONG
```

**Q: Port already in use**
```bash
# Find process using port
lsof -i :8000
lsof -i :3000

# Kill the process or change port in .env
```

**Q: Backend won't start**
```bash
# Clean install dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Q: Frontend build errors**
```bash
# Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Viewing Logs
```bash
# All Docker services
docker-compose logs -f

# Specific service
docker-compose logs -f mongodb
docker-compose logs -f redis

# Backend logs (when running locally)
cd backend
npm run start:dev

# Check queue dashboard
# Visit: http://localhost:8000/admin/queues
```

### Database Reset
```bash
# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Start fresh
./dev-setup.sh
```

## 📚 Documentation

- **[Development Setup Guide](./DEV_SETUP.md)** - Detailed development setup
- **[Backend README](./backend/README.md)** - Backend architecture
- **[Domain API Guide](./backend/DOMAIN_API.md)** - Domain monitoring API
- **[Integration Examples](./backend/INTEGRATION_EXAMPLES.md)** - Third-party integrations
- **[Monitoring Documentation](./backend/DOMAIN_MONITORING.md)** - Monitoring features
- **[Telegram Notifications](./backend/TELEGRAM_NOTIFICATIONS.md)** - Setup Telegram bot alerts
- **[Cloudflare Credentials](./backend/CLOUDFLARE_CREDENTIALS.md)** - Store Cloudflare API tokens


## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow existing code style
- Ensure all tests pass before submitting PR

## 📝 Available Scripts

### Root Directory
```bash
./dev.sh setup       # Setup everything (first time only)
./dev.sh start       # Start all services
./dev.sh stop        # Stop all services
./dev.sh restart     # Restart all services
./dev.sh status      # Show status of all services
./dev.sh logs        # View logs (backend/frontend/all)
./dev.sh clean       # Stop and clean up everything
```

Or use npm scripts:
```bash
npm run setup        # Setup everything
npm start            # Start all services
npm stop             # Stop all services
npm run status       # Show status
```

### Backend
```bash
cd backend
npm run start:dev      # Start with hot reload
npm run start:debug    # Start with debugging
npm run build          # Build for production
npm run start:prod     # Start production build
npm run test           # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Generate coverage report
```

### Frontend
```bash
cd frontend
npm start              # Start development server
npm run build          # Build for production
npm run test           # Run tests
```

## 📝 Changelog

### Version 1.0.0 (Current)
- ✨ Basic uptime monitoring
- ✨ Domain expiry tracking
- ✨ SSL certificate monitoring
- ✨ Cloudflare integration
- ✨ Real-time dashboard
- ✨ Email notifications
- ✨ Queue-based background jobs
- ✨ JWT authentication
- ✨ Swagger API documentation

### Recent Updates (v1.1.0)
- ✅ Telegram bot notifications for domain expiry alerts
- ✅ Cloudflare API credentials storage in database
- ✅ Hourly automated domain checks with bot detection avoidance
- ✅ User-specific notification preferences
- ✅ Comprehensive documentation for new features

### Roadmap (v1.2.0+)
- 🔄 Multi-region monitoring
- 📱 Mobile app (React Native)
- 🔗 Additional integrations (AWS Route 53, GoDaddy)
- 📊 Advanced analytics and reporting
- 🌍 Status page (public)
- 📈 Historical data export
- 🔔 Slack/Discord notifications
- 🎨 Customizable dashboard

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

Built with ❤️ by the Emika Team

## 📞 Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/emika-team/argi/issues)
- 📖 Documentation: [Full Docs](./DEV_SETUP.md)
- 💬 Discord: [Join our community](https://discord.gg/your-server)

---

⭐ If you find this project useful, please consider giving it a star! 