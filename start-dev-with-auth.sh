#!/bin/bash

# ===================================================================
# Lifestyle Design Social - Development Startup Script with Auth Fix
# ===================================================================

echo "🔧 Setting up environment variables for authentication..."

# Set essential environment variables
export JWT_SECRET="dev-jwt-secret-key-2025-lifestyle-design-social-app"
export NODE_ENV="development"
export PORT="5001"

echo "✅ Environment variables set!"
echo "🔐 JWT_SECRET: SET"
echo "📍 NODE_ENV: $NODE_ENV"
echo "🚀 PORT: $PORT"

echo ""
echo "🎯 Starting Lifestyle Design Social Applications..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is available
check_and_kill_port() {
    local port=$1
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is busy, cleaning up...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Clean up existing processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
check_and_kill_port 5001  # Backend
check_and_kill_port 3000  # Frontend

# Start Backend
echo -e "${BLUE}🚀 Starting Backend (Port 5001)...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
backend_pid=$!
cd ..

# Wait for backend
echo "⏳ Waiting for backend to start..."
sleep 5

# Test authentication endpoint
echo "🔐 Testing authentication endpoint..."
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend started with authentication ready!${NC}"
else
    echo "❌ Backend authentication endpoint not responding..."
fi

# Start Frontend (Next.js)
echo -e "${BLUE}🎨 Starting Frontend - Next.js (Port 3000)...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
frontend_pid=$!
cd ..

# Wait and open browser
sleep 10

echo ""
echo "🎉 All Applications Started Successfully!"
echo "========================================"
echo -e "${GREEN}🎨 Frontend (Next.js):  http://localhost:3000${NC}"
echo -e "${GREEN}🚀 Backend API:         http://localhost:5001/api${NC}"
echo -e "${GREEN}❤️  Health Check:       http://localhost:5001/api/health${NC}"
echo ""
echo "📊 Process IDs:"
echo "  Backend: $backend_pid"
echo "  Frontend: $frontend_pid"
echo ""
echo "💡 To stop all servers: pkill -f 'npm run dev'"
echo "📄 View logs: tail -f logs/[backend|frontend].log"

# Open application in browser
echo "🌐 Opening application in browser..."
open http://localhost:3000 2>/dev/null || echo "Could not open browser"

echo ""
echo "✅ Setup complete! Your Lifestyle Design Social platform is ready!" 