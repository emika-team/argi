# 🚀 Quick Reference

## Single Command Development

Everything is managed through one script: **`./dev.sh`**

### First Time Setup
```bash
chmod +x dev.sh
./dev.sh setup
```

### Daily Usage
```bash
./dev.sh start     # Start everything
./dev.sh stop      # Stop everything
./dev.sh status    # Check what's running
./dev.sh logs      # View logs
```

### Access URLs
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs
- **Queues**: http://localhost:8000/admin/queues

### All Commands
```bash
./dev.sh setup      # Setup infrastructure & install dependencies
./dev.sh start      # Start development servers
./dev.sh stop       # Stop all services
./dev.sh restart    # Restart all services
./dev.sh status     # Show status
./dev.sh logs       # View all logs
./dev.sh clean      # Clean up everything
```

### NPM Shortcuts
```bash
npm run setup       # = ./dev.sh setup
npm start           # = ./dev.sh start
npm stop            # = ./dev.sh stop
npm run status      # = ./dev.sh status
```

---

📖 Full documentation: [README.md](./README.md) | [QUICKSTART.md](./QUICKSTART.md)
