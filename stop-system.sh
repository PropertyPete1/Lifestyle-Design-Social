#!/bin/bash

# Auto-Posting App Stop Script
# This script stops both the backend server and frontend development server

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping Auto-Posting App System${NC}"
echo -e "${BLUE}====================================${NC}"

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local name=$2
    
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}🔪 Killing processes on port $port ($name)...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 1
        
        if lsof -ti:$port > /dev/null 2>&1; then
            echo -e "${RED}❌ Failed to kill processes on port $port${NC}"
        else
            echo -e "${GREEN}✅ Successfully stopped $name${NC}"
        fi
    else
        echo -e "${YELLOW}ℹ️  No processes found on port $port ($name)${NC}"
    fi
}

# Kill processes using saved PIDs
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}🔪 Killing backend process (PID: $BACKEND_PID)...${NC}"
        kill -9 $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend process stopped${NC}"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}🔪 Killing frontend process (PID: $FRONTEND_PID)...${NC}"
        kill -9 $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend process stopped${NC}"
    fi
    rm -f .frontend.pid
fi

# Kill any remaining processes on the ports
kill_port 5001 "Backend Server"
kill_port 3000 "Frontend Server"

# Clean up any Node.js processes that might be lingering
echo -e "${YELLOW}🧹 Cleaning up any lingering Node.js processes...${NC}"
pkill -f "node.*server" 2>/dev/null
pkill -f "next.*dev" 2>/dev/null

echo -e "${GREEN}🎉 System stopped successfully!${NC}"
echo -e "${BLUE}💡 To start the system again, run: ./start-system.sh${NC}" 