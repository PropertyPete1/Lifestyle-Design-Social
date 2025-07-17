#!/bin/bash

# Real Estate Auto-Posting App - Development Startup Script
echo "🏠 Starting Real Estate Auto-Posting App Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    pkill -f "node.*server" 2>/dev/null
    pkill -f "npm.*start" 2>/dev/null
    pkill -f "react-scripts start" 2>/dev/null
    exit 0
}

# Trap signals for cleanup
trap cleanup SIGINT SIGTERM

# Kill any existing processes
echo -e "${YELLOW}🔄 Cleaning up existing processes...${NC}"
pkill -f "node.*server" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
sleep 2

# Check if ports are free
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        lsof -Pi :$port -sTCP:LISTEN
        return 1
    fi
    return 0
}

# Check required ports
echo -e "${BLUE}🔍 Checking ports...${NC}"
if ! check_port 5001; then
    echo -e "${RED}❌ Backend port 5001 is busy. Killing processes...${NC}"
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if ! check_port 3000; then
    echo -e "${RED}❌ Frontend port 3000 is busy. Killing processes...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
echo -e "${YELLOW}⚠️  Database migrations will be handled by backend startup${NC}"

# Start backend server
echo -e "${BLUE}🚀 Starting backend server on port 5001...${NC}"
cd "$(dirname "$0")"
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
for i in {1..15}; do
    if curl -s http://localhost:5001/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend server is running!${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${RED}❌ Backend server failed to start${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
    echo -n "."
done

# Start frontend server
echo -e "${BLUE}🎨 Starting frontend server on port 3000...${NC}"
cd client
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend server is running!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend server failed to start${NC}"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
    echo -n "."
done

echo -e "\n${GREEN}🎉 Development environment is ready!${NC}"
echo -e "${BLUE}📱 Frontend: ${NC}http://localhost:3000"
echo -e "${BLUE}🔧 Backend API: ${NC}http://localhost:5001/api"
echo -e "${BLUE}❤️  Health Check: ${NC}http://localhost:5001/api/health"
echo -e "\n${YELLOW}💡 Press Ctrl+C to stop all servers${NC}\n"

# Monitor processes
while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend server crashed! Restarting...${NC}"
        cd "$(dirname "$0")"
        cd backend && npm run dev &
        BACKEND_PID=$!
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend server crashed! Restarting...${NC}"
        cd client
        npm start &
        FRONTEND_PID=$!
    fi
    
    sleep 5
done 