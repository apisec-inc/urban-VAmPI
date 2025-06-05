#!/bin/bash

# VAmPI Deployment Script (Combined)
# Usage: ./scripts/deploy.sh [staging|production] (run from vampi directory)

set -e  # Exit on any error

echo "🚀 VAmPI Deployment Tool"
echo "======================="
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

# Determine environment
if [ $# -eq 1 ]; then
    ENVIRONMENT=$1
else
    echo "Select deployment environment:"
    echo "1) Staging"
    echo "2) Production"
    echo ""
    read -p "Enter choice (1-2): " choice
    case $choice in
        1) ENVIRONMENT="staging" ;;
        2) ENVIRONMENT="production" ;;
        *) echo "❌ Invalid choice"; exit 1 ;;
    esac
fi

echo ""

# Set environment-specific variables
if [ "$ENVIRONMENT" = "staging" ]; then
    RAILWAY_ENV_TOKEN="$RAILWAY_TOKEN_STAGING"
    URL="https://urban-vampi-staging.up.railway.app"
    ENV_DISPLAY="Staging"
else
    RAILWAY_ENV_TOKEN="$RAILWAY_TOKEN"
    URL="https://urban-vampi-production.up.railway.app"
    ENV_DISPLAY="Production"
fi

# Check environment variables
if [ -z "$RAILWAY_ENV_TOKEN" ]; then
    echo "❌ Railway token not set for $ENVIRONMENT environment"
    if [ "$ENVIRONMENT" = "staging" ]; then
        echo "   Please either:"
        echo "   1. Export in your shell: export RAILWAY_TOKEN_STAGING=your_token_here"
        echo "   2. Add to .env: RAILWAY_TOKEN_STAGING=your_token_here"
    else
        echo "   Please either:"
        echo "   1. Export in your shell: export RAILWAY_TOKEN=your_token_here"
        echo "   2. Add to .env: RAILWAY_TOKEN=your_token_here"
    fi
    exit 1
fi

echo "✅ Railway CLI found"
echo "✅ $ENV_DISPLAY token configured"
echo ""

# Confirm production deployment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "⚠️  You are about to deploy to PRODUCTION"
    echo "   URL: $URL"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
    echo ""
fi

# Set Railway token for this deployment
export RAILWAY_TOKEN="$RAILWAY_ENV_TOKEN"

echo "🔧 Configuring Railway environment..."
railway environment $ENVIRONMENT
echo "✅ Set to $ENVIRONMENT environment"

echo "🔧 Setting service..."
railway service e24b40e8-1586-4fe9-9dea-35661be40df7
echo "✅ Service configured"

echo ""
echo "🚀 Starting $ENV_DISPLAY deployment..."
echo "   This may take 1-2 minutes..."

# Deploy with verbose output
railway up --detach

echo "✅ Deployment initiated!"
echo ""

echo "⏳ Waiting for deployment to complete..."
sleep 30

echo "🔍 Testing $ENV_DISPLAY deployment..."
if curl -f -s $URL/ > /dev/null; then
    echo "✅ Main endpoint responding"
else
    echo "⚠️  Main endpoint not responding yet (may still be starting)"
fi

if curl -f -s $URL/deployment-test > /dev/null; then
    echo "✅ Test endpoint responding"
else
    echo "⚠️  Test endpoint not responding yet (may still be starting)"
fi

echo ""
echo "🎉 VAmPI $ENV_DISPLAY Deployment Complete!"
echo "📍 URL: $URL"
echo "🔍 Admin: $URL/users/v1"
echo ""
echo "💡 Demo Commands:"
echo "   curl $URL/"
echo "   curl $URL/users/v1"
echo "" 