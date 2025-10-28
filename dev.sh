#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print header
print_header() {
    echo ""
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
}

# Function to check Docker
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
}

# Function to check if containers are running
check_infrastructure() {
    if ! docker ps | grep -q monitor_mongodb; then
        return 1
    fi
    if ! docker ps | grep -q monitor_redis; then
        return 1
    fi
    return 0
}

# Function to setup infrastructure
setup_infrastructure() {
    print_header "Setting Up Infrastructure"
    
    check_docker
    
    # Create .env files if they don't exist
    if [ ! -f backend/.env ]; then
        echo -e "${YELLOW}Creating backend/.env...${NC}"
        cp backend/env.example backend/.env 2>/dev/null || cat > backend/.env << 'EOF'
MONGODB_URI=mongodb://admin:password123@localhost:27017/monitor_db?authSource=admin
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=8000
JWT_SECRET=dev-super-secret-jwt-key-change-in-production-12345678
JWT_EXPIRY=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ENABLE_EMAIL_ALERTS=false
DEFAULT_CHECK_INTERVAL=60
SSL_CHECK_INTERVAL=86400
DOMAIN_CHECK_INTERVAL=86400
EOF
        echo -e "${GREEN}✓ Created backend/.env${NC}"
    fi
    
    if [ ! -f frontend/.env ]; then
        echo -e "${YELLOW}Creating frontend/.env...${NC}"
        cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000
PORT=3000
EOF
        echo -e "${GREEN}✓ Created frontend/.env${NC}"
    fi
    
    # Stop existing containers
    echo -e "${YELLOW}Stopping existing containers...${NC}"
    docker-compose down > /dev/null 2>&1
    
    # Start MongoDB and Redis
    echo -e "${YELLOW}Starting MongoDB and Redis...${NC}"
    docker-compose up -d mongodb redis
    
    # Wait for MongoDB
    echo -e "${YELLOW}Waiting for MongoDB...${NC}"
    sleep 5
    until docker exec monitor_mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
        echo -e "${YELLOW}  Still waiting for MongoDB...${NC}"
        sleep 2
    done
    echo -e "${GREEN}✓ MongoDB is ready${NC}"
    
    # Wait for Redis
    echo -e "${YELLOW}Waiting for Redis...${NC}"
    until docker exec monitor_redis redis-cli ping > /dev/null 2>&1; do
        echo -e "${YELLOW}  Still waiting for Redis...${NC}"
        sleep 2
    done
    echo -e "${GREEN}✓ Redis is ready${NC}"
    
    echo ""
    echo -e "${GREEN}✓ Infrastructure setup complete!${NC}"
}

# Function to install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    if [ ! -d "backend/node_modules" ]; then
        echo -e "${YELLOW}Installing backend dependencies...${NC}"
        cd backend && npm install && cd ..
        echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies...${NC}"
        cd frontend && npm install && cd ..
        echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
    fi
}

# Function to start development servers
start_dev_servers() {
    print_header "Starting Development Servers"
    
    # Check infrastructure
    if ! check_infrastructure; then
        echo -e "${RED}❌ Infrastructure not running. Run './dev.sh setup' first.${NC}"
        exit 1
    fi
    
    # Get absolute path
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    echo -e "${CYAN}Starting backend server...${NC}"
    (cd "$SCRIPT_DIR/backend" && npm run start:dev) > "$SCRIPT_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    echo -e "${CYAN}Starting frontend server...${NC}"
    (cd "$SCRIPT_DIR/frontend" && npm start) > "$SCRIPT_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    # Wait a moment for servers to start
    sleep 3
    
    print_header "Development Environment Running!"
    
    echo -e "${GREEN}🚀 Frontend:${NC}  http://localhost:3000"
    echo -e "${GREEN}🚀 Backend:${NC}   http://localhost:8000"
    echo -e "${GREEN}📚 API Docs:${NC}  http://localhost:8000/api/docs"
    echo -e "${GREEN}📊 Queues:${NC}    http://localhost:8000/admin/queues"
    echo ""
    echo -e "${YELLOW}Logs:${NC}"
    echo -e "  Backend: tail -f $SCRIPT_DIR/backend.log"
    echo -e "  Frontend: tail -f $SCRIPT_DIR/frontend.log"
    echo ""
    echo -e "${CYAN}Press Ctrl+C to stop all servers${NC}"
    echo ""
    
    # Save PIDs
    echo "$BACKEND_PID" > "$SCRIPT_DIR/.backend.pid"
    echo "$FRONTEND_PID" > "$SCRIPT_DIR/.frontend.pid"
    
    # Wait for Ctrl+C
    trap cleanup SIGINT SIGTERM
    wait
}

# Function to stop servers
stop_servers() {
    print_header "Stopping All Services"
    
    # Kill dev servers
    if [ -f .backend.pid ]; then
        BACKEND_PID=$(cat .backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID 2>/dev/null
            echo -e "${GREEN}✓ Backend stopped${NC}"
        fi
        rm -f .backend.pid
    fi
    
    if [ -f .frontend.pid ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID 2>/dev/null
            echo -e "${GREEN}✓ Frontend stopped${NC}"
        fi
        rm -f .frontend.pid
    fi
    
    # Kill any remaining npm/node processes from this project
    pkill -f "nest start --watch" 2>/dev/null
    pkill -f "react-scripts start" 2>/dev/null
    
    # Stop Docker containers
    echo -e "${YELLOW}Stopping Docker containers...${NC}"
    docker-compose down > /dev/null 2>&1
    echo -e "${GREEN}✓ Docker containers stopped${NC}"
    
    # Clean up log files
    rm -f backend.log frontend.log
    
    echo ""
    echo -e "${GREEN}✓ All services stopped${NC}"
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    stop_servers
    exit 0
}

# Function to show status
show_status() {
    print_header "System Status"
    
    echo -e "${CYAN}Infrastructure:${NC}"
    if docker ps | grep -q monitor_mongodb; then
        echo -e "  MongoDB: ${GREEN}✓ Running${NC}"
    else
        echo -e "  MongoDB: ${RED}✗ Stopped${NC}"
    fi
    
    if docker ps | grep -q monitor_redis; then
        echo -e "  Redis:   ${GREEN}✓ Running${NC}"
    else
        echo -e "  Redis:   ${RED}✗ Stopped${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}Development Servers:${NC}"
    
    if [ -f .backend.pid ] && kill -0 $(cat .backend.pid) 2>/dev/null; then
        echo -e "  Backend:  ${GREEN}✓ Running${NC}"
    else
        echo -e "  Backend:  ${RED}✗ Stopped${NC}"
    fi
    
    if [ -f .frontend.pid ] && kill -0 $(cat .frontend.pid) 2>/dev/null; then
        echo -e "  Frontend: ${GREEN}✓ Running${NC}"
    else
        echo -e "  Frontend: ${RED}✗ Stopped${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}Dependencies:${NC}"
    
    if [ -d "backend/node_modules" ]; then
        echo -e "  Backend:  ${GREEN}✓ Installed${NC}"
    else
        echo -e "  Backend:  ${RED}✗ Not installed${NC}"
    fi
    
    if [ -d "frontend/node_modules" ]; then
        echo -e "  Frontend: ${GREEN}✓ Installed${NC}"
    else
        echo -e "  Frontend: ${RED}✗ Not installed${NC}"
    fi
    echo ""
}

# Function to show logs
show_logs() {
    if [ "$1" = "backend" ]; then
        tail -f backend.log
    elif [ "$1" = "frontend" ]; then
        tail -f frontend.log
    else
        echo -e "${YELLOW}Showing all logs (Ctrl+C to stop)${NC}"
        tail -f backend.log frontend.log
    fi
}

# Main script
show_usage() {
    echo ""
    echo -e "${CYAN}Uptime Monitor - Development Script${NC}"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup    - Setup infrastructure (MongoDB + Redis) and install dependencies"
    echo "  start    - Start development servers (backend + frontend)"
    echo "  stop     - Stop all services (servers + Docker)"
    echo "  restart  - Restart all services"
    echo "  status   - Show status of all services"
    echo "  logs     - Show logs (backend/frontend/all)"
    echo "  clean    - Stop everything and clean up"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh setup          # First time setup"
    echo "  ./dev.sh start          # Start development"
    echo "  ./dev.sh logs backend   # View backend logs"
    echo "  ./dev.sh stop           # Stop everything"
    echo ""
}

# Handle commands
case "$1" in
    setup)
        setup_infrastructure
        install_dependencies
        echo ""
        echo -e "${GREEN}✅ Setup complete! Run './dev.sh start' to begin development.${NC}"
        ;;
    start)
        install_dependencies
        start_dev_servers
        ;;
    stop)
        stop_servers
        ;;
    restart)
        stop_servers
        sleep 2
        install_dependencies
        start_dev_servers
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs $2
        ;;
    clean)
        stop_servers
        echo -e "${YELLOW}Cleaning up...${NC}"
        rm -f backend.log frontend.log .backend.pid .frontend.pid
        echo -e "${GREEN}✓ Cleaned up${NC}"
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
