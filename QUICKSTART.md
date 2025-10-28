# ⚡ Quick Start Guide

Get up and running with the Uptime & Domain Monitor in 2 simple steps!

## 🎯 Prerequisites

- **Docker** installed and running
- **Node.js** 18+ installed
- **npm** installed

## 🚀 2-Step Setup

### Step 1: Setup Everything

```bash
# Make script executable and run setup
chmod +x dev.sh
./dev.sh setup
```

This will:
- ✅ Start MongoDB on port 27017
- ✅ Start Redis on port 6379
- ✅ Create `.env` files automatically
- ✅ Install all dependencies

### Step 2: Start Development

```bash
./dev.sh start
```

This starts:
- 🌐 Frontend on http://localhost:3000
- 🔧 Backend API on http://localhost:8000

## 🎉 You're Ready!

Access your application:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Queue Dashboard**: http://localhost:8000/admin/queues

## 📖 Next Steps

### 1. Register a User

Visit http://localhost:3000/register and create an account.

### 2. Add Your First Monitor

1. Go to "Monitors" page
2. Click "Add Monitor"
3. Enter a website URL (e.g., https://google.com)
4. Select monitor type: HTTP/HTTPS
5. Click "Save"

### 3. Import Domains from Cloudflare (Optional)

1. Go to "Integrations" page
2. Click "Cloudflare"
3. Enter your Cloudflare credentials:
   - Email
   - API Key or API Token
4. Click "Fetch Zones"
5. Select domains to import
6. Click "Import"

### 4. View Dashboard

Go to the Dashboard to see:
- 📊 Monitor statistics
- 📅 Domain expiry dates
- 🔒 SSL certificate status
- ⚠️ Recent alerts

## 🔧 Useful Commands

```bash
# View status of all services
./dev.sh status

# View logs
./dev.sh logs          # All logs
./dev.sh logs backend  # Backend only
./dev.sh logs frontend # Frontend only

# Stop all services
./dev.sh stop

# Restart everything
./dev.sh restart

# Clean up everything
./dev.sh clean
```

Or use npm:
```bash
npm run status
npm stop
npm start
```

## 🐛 Troubleshooting

### Services won't start?

```bash
./dev.sh clean    # Clean up
./dev.sh setup    # Setup again
./dev.sh start    # Start
```

### Port conflicts?

Check if ports are in use:
```bash
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :27017 # MongoDB
lsof -i :6379  # Redis
```

### View what's running

```bash
./dev.sh status
```

## 📚 Learn More

- [Full Development Guide](./DEV_SETUP.md)
- [API Documentation](http://localhost:8000/api/docs)
- [Backend README](./backend/README.md)
- [Domain API Guide](./backend/DOMAIN_API.md)

## 🆘 Need Help?

- Check [DEV_SETUP.md](./DEV_SETUP.md) for detailed troubleshooting
- View logs: `docker-compose logs -f`
- Check API docs: http://localhost:8000/api/docs
- Check queue dashboard: http://localhost:8000/admin/queues

---

Happy monitoring! 🎉
