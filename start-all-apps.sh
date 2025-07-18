#!/bin/bash

# Lifestyle Design Social - Production Startup Script
echo "🏗️ Starting Lifestyle Design Social - Production Mode"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        echo -e "${YELLOW}💡 Killing existing processes...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for server to be ready
wait_for_server() {
    local port=$1
    local name=$2
    local path=${3:-"/"}
    echo -e "${YELLOW}⏳ Waiting for $name to start on port $port...${NC}"
    
    for i in {1..30}; do
        if curl -s http://localhost:$port$path > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ $name failed to start within 30 seconds${NC}"
    return 1
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down all applications...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    exit 0
}

# Trap signals for cleanup
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
check_port 5001  # Backend
check_port 3000  # Frontend

# Ensure required directories exist
mkdir -p data logs

echo -e "${BLUE}🚀 Starting Backend Server (Port 5001)...${NC}"
cd backend
export JWT_SECRET="production-jwt-secret-key-2025-lifestyle-design-social"
export NODE_ENV="production"
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
if wait_for_server 5001 "Backend Server" "/api/health"; then
    echo -e "${GREEN}✅ Backend Server started successfully${NC}"
else
    echo -e "${RED}❌ Backend Server failed to start${NC}"
    echo -e "${YELLOW}📄 Check logs/backend.log for details${NC}"
    exit 1
fi

echo -e "${BLUE}🎨 Starting Frontend (Next.js) on Port 3000...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
sleep 8
if wait_for_server 3000 "Frontend (Next.js)"; then
    echo -e "${GREEN}✅ Frontend (Next.js) started successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend (Next.js) may still be starting up...${NC}"
fi

# Display system information
echo -e "${GREEN}🎉 Production System Started Successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎨 Frontend Application: http://localhost:3000${NC}"
echo -e "${GREEN}🚀 Backend API:          http://localhost:5001/api${NC}"
echo -e "${GREEN}❤️  Health Check:        http://localhost:5001/api/health${NC}"
echo -e "${GREEN}============================================${NC}"

echo -e "${BLUE}📊 Process Information:${NC}"
echo -e "${BLUE}Backend PID:  $BACKEND_PID${NC}"
echo -e "${BLUE}Frontend PID: $FRONTEND_PID${NC}"

echo -e "${YELLOW}📄 Logs are being written to:${NC}"
echo -e "${YELLOW}  - Backend:  logs/backend.log${NC}"
echo -e "${YELLOW}  - Frontend: logs/frontend.log${NC}"

echo -e "${BLUE}💡 To stop all servers: pkill -f 'npm run dev'${NC}"
echo -e "${BLUE}🌐 Opening application in browser...${NC}"
sleep 2
open http://localhost:3000 2>/dev/null || echo "Could not open browser automatically"

# Keep script running
echo -e "${YELLOW}📋 Production system is ready! Press Ctrl+C to stop all services.${NC}"
wait $BACKEND_PID $FRONTEND_PID 