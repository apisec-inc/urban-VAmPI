#!/bin/bash

# VAmPI Staging Deployment Script
# Usage: ./scripts/deploy-staging.sh (run from vampi directory)

set -e  # Exit on any error

echo "🚀 VAmPI Staging Deployment"
echo "=========================="
echo ""

# Ensure we're in the VAmPI directory
if [ ! -f "app.py" ] || [ ! -f "railway.json" ]; then
    echo "❌ This script must be run from the VAmPI directory"
    echo "   Expected files: app.py, railway.json"
    echo "   Current directory: $(pwd)"
    exit 1
fi

echo "📂 VAmPI directory: $(pwd)"

# Source .env file from current directory
if [ -f ".env" ]; then
    echo "🔧 Loading environment variables from .env file..."
    set -a  # automatically export all variables
    source .env
    set +a  # stop automatically exporting
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env file found in VAmPI directory"
    echo "   Using environment variables from shell"
fi
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

# Check environment variables
if [ -z "$RAILWAY_TOKEN_STAGING" ]; then
    echo "❌ RAILWAY_TOKEN_STAGING environment variable not set"
    echo "   Please either:"
    echo "   1. Export in your shell: export RAILWAY_TOKEN_STAGING=your_token_here"
    echo "   2. Add to .env: RAILWAY_TOKEN_STAGING=your_token_here"
    exit 1
fi

echo "✅ Railway CLI found"
echo "✅ Staging token configured"
echo ""

# Set Railway token for this deployment
export RAILWAY_TOKEN="$RAILWAY_TOKEN_STAGING"

echo "🔧 Configuring Railway environment..."
railway environment staging
echo "✅ Set to staging environment"

echo "🔧 Setting service..."
railway service e24b40e8-1586-4fe9-9dea-35661be40df7
echo "✅ Service configured"

echo ""
echo "🚀 Starting deployment..."
echo "   This may take 1-2 minutes..."

# Deploy with verbose output
railway up --detach

echo "✅ Deployment initiated!"
echo ""

echo "⏳ Waiting for deployment to complete..."
sleep 30

echo "🔍 Testing deployment..."
if curl -f -s https://urban-vampi-staging.up.railway.app/ > /dev/null; then
    echo "✅ Main endpoint responding"
else
    echo "⚠️  Main endpoint not responding yet (may still be starting)"
fi

if curl -f -s https://urban-vampi-staging.up.railway.app/deployment-test > /dev/null; then
    echo "✅ Test endpoint responding"
else
    echo "⚠️  Test endpoint not responding yet (may still be starting)"
fi

echo ""
echo "🎉 VAmPI Staging Deployment Complete!"
echo "📍 URL: https://urban-vampi-staging.up.railway.app"
echo "🔍 Admin: https://urban-vampi-staging.up.railway.app/users/v1"
echo ""
echo "💡 Demo Commands:"
echo "   curl https://urban-vampi-staging.up.railway.app/"
echo "   curl https://urban-vampi-staging.up.railway.app/users/v1"
echo "" 