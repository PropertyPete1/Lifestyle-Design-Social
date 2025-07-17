#!/bin/bash

echo "🧹 Cleaning up existing processes..."
pkill -f "node.*server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "npm start" 2>/dev/null
sleep 2

echo "🚀 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 3

echo "🌐 Starting frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servers starting up!"
echo "📊 Backend: http://localhost:5001/api"
echo "🖥️  Frontend: http://localhost:3000"
echo ""
echo "🔑 Demo Login:"
echo "   Email: admin@example.com"
echo "   Password: password123"
echo ""
echo "💡 To stop servers: pkill -f 'node server' && pkill -f 'next dev'"

# Wait for user to press Ctrl+C
trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait 