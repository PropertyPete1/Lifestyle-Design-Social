#!/bin/bash

# Auto-Posting App Startup Script
# This script starts both the backend server and frontend development server

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Auto-Posting App System${NC}"
echo -e "${BLUE}====================================${NC}"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        echo -e "${YELLOW}💡 Killing existing processes...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

# Function to wait for server to be ready
wait_for_server() {
    local port=$1
    local name=$2
    echo -e "${YELLOW}⏳ Waiting for $name to start on port $port...${NC}"
    
    for i in {1..30}; do
        if curl -s http://localhost:$port/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ $name failed to start within 30 seconds${NC}"
    return 1
}

# Check for required files
echo -e "${BLUE}📋 Checking system requirements...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

if [ ! -d "backend" ]; then
    echo -e "${RED}❌ backend directory not found${NC}"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ frontend directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required files found${NC}"

# Clean up any existing processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
check_port 5001
check_port 3000

# Ensure data directory exists
mkdir -p data

# Start Backend Server (TypeScript Development Mode)
echo -e "${BLUE}🔧 Starting Backend Server (Port 5001)...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
if wait_for_server 5001 "Backend Server"; then
    echo -e "${GREEN}✅ Backend Server started successfully (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend Server failed to start${NC}"
    echo -e "${YELLOW}📄 Check backend.log for details${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start Frontend Development Server
echo -e "${BLUE}🎨 Starting Frontend Development Server (Port 3000)...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
sleep 5
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend Development Server started successfully (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may still be starting up...${NC}"
fi

# Display system information
echo -e "${GREEN}🎉 System Started Successfully!${NC}"
echo -e "${GREEN}==============================${NC}"
echo -e "${GREEN}Frontend URL: http://localhost:3000${NC}"
echo -e "${GREEN}Backend API:  http://localhost:5001/api${NC}"
echo -e "${GREEN}Health Check: http://localhost:5001/health${NC}"
echo -e "${GREEN}==============================${NC}"

# Display process information
echo -e "${BLUE}📊 Process Information:${NC}"
echo -e "${BLUE}Backend PID:  $BACKEND_PID${NC}"
echo -e "${BLUE}Frontend PID: $FRONTEND_PID${NC}"

# Save PIDs for cleanup
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo -e "${YELLOW}📄 Logs are being written to:${NC}"
echo -e "${YELLOW}  - Backend:  backend.log${NC}"
echo -e "${YELLOW}  - Frontend: frontend.log${NC}"

echo -e "${BLUE}🛑 To stop the system, run: ./stop-system.sh${NC}"
echo -e "${BLUE}📊 To check status, run: ./check-status.sh${NC}"

# Keep script running and show live logs
echo -e "${BLUE}📋 Live Backend Logs (Ctrl+C to exit):${NC}"
echo -e "${BLUE}=====================================\n${NC}"

# Follow backend logs
tail -f backend.log 