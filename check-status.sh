#!/bin/bash

echo "🔍 Checking Real Estate Auto-Posting SaaS Status..."
echo ""

# Check backend
echo "🔧 Backend Server (Port 5001):"
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "   ✅ Running - $(curl -s http://localhost:5001/api/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
    echo "   🔗 http://localhost:5001/api/health"
else
    echo "   ❌ Not running"
fi

echo ""

# Check frontend
echo "📱 Frontend Server (Port 3000):"
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Running"
    echo "   🔗 http://localhost:3000"
else
    echo "   ❌ Not running"
fi

echo ""

# Check ports
echo "📊 Port Usage:"
lsof -i :3000 -i :5001 2>/dev/null | grep LISTEN | while read line; do
    echo "   • $line"
done

echo ""

# Test login
echo "🔐 Testing Authentication:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"password123"}' 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "   ✅ Login working"
    echo "   👤 Demo user: admin@example.com"
else
    echo "   ❌ Login failed"
fi

echo ""
echo "🎯 Quick Access:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:5001/api"
echo "   • Health Check: http://localhost:5001/api/health" 