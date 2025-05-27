#!/bin/bash
# Development script - Auto-starts Docker containers and SvelteKit dev server

echo "🚀 Starting Crypto Tracker Development Environment..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Check if containers are already running
REDIS_RUNNING=$(docker ps --filter "name=crypto_tracker_redis" --filter "status=running" -q)
MCP_RUNNING=$(docker ps --filter "name=crypto_tracker_redis_mcp_inspector" --filter "status=running" -q)

if [ -z "$REDIS_RUNNING" ] || [ -z "$MCP_RUNNING" ]; then
    echo "🐳 Starting Docker containers..."
    docker-compose up -d redis redis-mcp-inspector
    
    # Wait for containers to be ready
    echo "⏳ Waiting for containers to be ready..."
    sleep 5
    
    # Check if containers started successfully
    if ! docker ps --filter "name=crypto_tracker_redis" --filter "status=running" -q >/dev/null; then
        echo "❌ Failed to start Redis container"
        exit 1
    fi
    
    if ! docker ps --filter "name=crypto_tracker_redis_mcp_inspector" --filter "status=running" -q >/dev/null; then
        echo "❌ Failed to start MCP Inspector container"
        exit 1
    fi
    
    echo "✅ All Docker containers are running"
else
    echo "✅ Docker containers already running"
fi

# Show container status
echo "📊 Container Status:"
docker ps --filter "name=crypto_tracker" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🎯 Development URLs:"
echo "   - SvelteKit App: http://localhost:5173"
echo "   - Redis: localhost:6379"
echo "   - MCP Inspector: http://localhost:6274"
echo ""
echo "🔥 Starting SvelteKit development server..."

# Start SvelteKit dev server
npm run prepare && vite dev
