#!/bin/bash

echo "🏠 Setting up Real Estate Video Management System"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create necessary directories
echo "📁 Creating upload directories..."
mkdir -p uploads
mkdir -p uploads/videos
mkdir -p uploads/thumbnails

# Set proper permissions
echo "🔐 Setting directory permissions..."
chmod 755 uploads
chmod 755 uploads/videos
chmod 755 uploads/thumbnails

# Check if database exists and create if needed
echo "🗄️ Checking database..."
if [ ! -f "data/app.db" ]; then
    echo "📊 Creating new database..."
    mkdir -p data
    touch data/app.db
    echo "✅ Database created"
else
    echo "✅ Database already exists"
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "🔧 Creating environment file..."
    cp env.example .env
    echo "✅ Environment file created (please configure your settings)"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Configure your .env file with your settings"
echo "2. Start the server: npm start"
echo "3. Open the app and navigate to the Videos page"
echo "4. Upload your first real estate video"
echo "5. Check the AutoPost page to see video statistics"
echo ""
echo "📚 Read REAL_ESTATE_VIDEO_GUIDE.md for detailed instructions"
echo ""
echo "🚀 Happy posting!" 