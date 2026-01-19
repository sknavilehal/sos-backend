#!/bin/bash
# Quick start script for RRT backend

echo "🚀 Starting RRT Backend Server..."
echo "📍 Current directory: $(pwd)"
echo ""

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Make sure you're in the rrt-backend directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please configure your environment first"
    echo "See FIREBASE_SETUP.md for instructions"
    exit 1
fi

# Check if Firebase service account key exists
SERVICE_ACCOUNT_PATH=$(grep "FIREBASE_SERVICE_ACCOUNT_PATH" .env | cut -d'=' -f2)
if [ ! -f "$SERVICE_ACCOUNT_PATH" ]; then
    echo "⚠️  Warning: Firebase service account key not found at $SERVICE_ACCOUNT_PATH"
    echo "The server will start but Firebase features won't work"
    echo "See FIREBASE_SETUP.md for setup instructions"
    echo ""
fi

# Start the server in development mode
echo "🎯 Starting server in development mode..."
echo "📡 Health check: http://localhost:3000/health"
echo "🆘 SOS endpoint: http://localhost:3000/api/sos"
echo ""
echo "💡 Tip: Use 'npm run start' for production mode"
echo ""

npm run dev