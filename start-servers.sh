#!/bin/bash

# Real Estate Auto-Posting SaaS - Server Startup Script
echo "🏠 Starting Real Estate Auto-Posting SaaS..."

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "node.*server" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
lsof -ti:3000,5001 | xargs kill -9 2>/dev/null || true

# Wait for cleanup
sleep 2

# Start backend server
echo "🚀 Starting backend server on port 5001..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server on port 3000..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend server is running"
else
    echo "❌ Frontend server failed to start"
    exit 1
fi

echo ""
echo "🎉 All servers are running successfully!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5001/api"
echo "❤️  Health Check: http://localhost:5001/api/health"
echo ""
echo "💡 Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# Keep script running
wait 