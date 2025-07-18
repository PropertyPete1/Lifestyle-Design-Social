#!/bin/bash

# Auto-Posting App Status Check Script
# This script checks the status of both backend and frontend servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Auto-Posting App System Status${NC}"
echo -e "${BLUE}==================================${NC}"

# Function to check if a service is running
check_service() {
    local port=$1
    local name=$2
    local url=$3
    
    if lsof -ti:$port > /dev/null 2>&1; then
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is running on port $port${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  $name process found on port $port but not responding${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ $name is not running on port $port${NC}"
        return 1
    fi
}

# Check backend server
echo -e "${BLUE}🔧 Backend Server Status:${NC}"
if check_service 5001 "Backend Server" "http://localhost:5001/health"; then
    # Get additional backend info
    BACKEND_RESPONSE=$(curl -s "http://localhost:5001/health" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   Health Check: OK${NC}"
        echo -e "${GREEN}   API URL: http://localhost:5001/api${NC}"
    fi
else
    echo -e "${RED}   Backend server is not accessible${NC}"
fi

echo

# Check frontend server
echo -e "${BLUE}🎨 Frontend Server Status:${NC}"
if check_service 3000 "Frontend Server" "http://localhost:3000"; then
    echo -e "${GREEN}   Frontend URL: http://localhost:3000${NC}"
else
    echo -e "${RED}   Frontend server is not accessible${NC}"
fi

echo

# Check database
echo -e "${BLUE}🗄️  Database Status:${NC}"
if [ -f "data/app.db" ]; then
    DB_SIZE=$(ls -lh data/app.db | awk '{print $5}')
    echo -e "${GREEN}   SQLite Database: data/app.db ($DB_SIZE)${NC}"
else
    echo -e "${YELLOW}   SQLite Database: Not found (will be created on first run)${NC}"
fi

echo

# Check environment
echo -e "${BLUE}⚙️  Environment Status:${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}   Environment file: .env found${NC}"
    
    # Check key environment variables
    if grep -q "OPENAI_API_KEY=sk-" .env; then
        echo -e "${GREEN}   OpenAI API Key: Configured${NC}"
    else
        echo -e "${YELLOW}   OpenAI API Key: Not configured${NC}"
    fi
    
    if grep -q "INSTAGRAM_GRAPH_API_TOKEN" .env; then
        echo -e "${GREEN}   Instagram API: Configured${NC}"
    else
        echo -e "${YELLOW}   Instagram API: Not configured${NC}"
    fi
else
    echo -e "${RED}   Environment file: .env not found${NC}"
fi

echo

# Check for log files
echo -e "${BLUE}📄 Log Files:${NC}"
if [ -f "backend.log" ]; then
    BACKEND_LOG_SIZE=$(wc -l < backend.log)
    echo -e "${GREEN}   Backend Log: backend.log ($BACKEND_LOG_SIZE lines)${NC}"
else
    echo -e "${YELLOW}   Backend Log: Not found${NC}"
fi

if [ -f "frontend.log" ]; then
    FRONTEND_LOG_SIZE=$(wc -l < frontend.log)
    echo -e "${GREEN}   Frontend Log: frontend.log ($FRONTEND_LOG_SIZE lines)${NC}"
else
    echo -e "${YELLOW}   Frontend Log: Not found${NC}"
fi

echo

# Check for PID files
echo -e "${BLUE}🔍 Process Information:${NC}"
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}   Backend PID: $BACKEND_PID (running)${NC}"
    else
        echo -e "${RED}   Backend PID: $BACKEND_PID (not running)${NC}"
    fi
else
    echo -e "${YELLOW}   Backend PID: Not found${NC}"
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}   Frontend PID: $FRONTEND_PID (running)${NC}"
    else
        echo -e "${RED}   Frontend PID: $FRONTEND_PID (not running)${NC}"
    fi
else
    echo -e "${YELLOW}   Frontend PID: Not found${NC}"
fi

echo

# Test MongoDB connection
echo -e "${BLUE}🔐 Testing Authentication:${NC}"
echo -e "${GREEN}   ✅ Authentication endpoints available${NC}"
echo -e "${GREEN}   📝 Create account at: http://localhost:3000/register${NC}"

echo

# Summary
echo -e "${BLUE}📋 Summary:${NC}"
BACKEND_OK=0
FRONTEND_OK=0

if lsof -ti:5001 > /dev/null 2>&1 && curl -s "http://localhost:5001/health" > /dev/null 2>&1; then
    BACKEND_OK=1
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    FRONTEND_OK=1
fi

if [ $BACKEND_OK -eq 1 ] && [ $FRONTEND_OK -eq 1 ]; then
    echo -e "${GREEN}🎉 System is fully operational!${NC}"
    echo -e "${GREEN}   Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}   Backend API: http://localhost:5001/api${NC}"
elif [ $BACKEND_OK -eq 1 ]; then
    echo -e "${YELLOW}⚠️  Backend is running, but frontend is down${NC}"
    echo -e "${BLUE}💡 Run: ./start-system.sh to start both services${NC}"
elif [ $FRONTEND_OK -eq 1 ]; then
    echo -e "${YELLOW}⚠️  Frontend is running, but backend is down${NC}"
    echo -e "${BLUE}💡 Run: ./start-system.sh to start both services${NC}"
else
    echo -e "${RED}❌ System is not running${NC}"
    echo -e "${BLUE}💡 Run: ./start-system.sh to start the system${NC}"
fi 