#!/bin/bash

# Development Setup Script - Ensures Docker containers are running for development

echo "🚀 Setting up development environment..."

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to check if a container is running
is_container_running() {
    docker ps --filter "name=$1" --filter "status=running" --format "{{.Names}}" | grep -q "^$1$"
}

# Function to check if a container exists (running or stopped)
container_exists() {
    docker ps -a --filter "name=$1" --format "{{.Names}}" | grep -q "^$1$"
}

# Function to start containers using docker-compose
start_containers() {
    echo "🐳 Starting Docker containers..."
    
    # Start the containers using docker-compose
    docker-compose up -d redis redis-mcp-inspector
    
    # Wait a moment for containers to start
    sleep 3
    
    # Check if containers are running
    if is_container_running "crypto_tracker_redis"; then
        echo "✅ Redis container is running"
    else
        echo "❌ Failed to start Redis container"
        exit 1
    fi
    
    if is_container_running "crypto_tracker_redis_mcp_inspector"; then
        echo "✅ MCP Inspector container is running"
    else
        echo "❌ Failed to start MCP Inspector container"
        exit 1
    fi
}

# Function to check container health
check_container_health() {
    echo "🔍 Checking container health..."
    
    # Check Redis connection
    if docker exec crypto_tracker_redis redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis is responding"
    else
        echo "⚠️  Redis is not responding yet (this is normal on first start)"
    fi
    
    # Show container status
    echo "📊 Container status:"
    docker ps --filter "name=crypto_tracker" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Main execution
echo "===================================="
echo "  Crypto Tracker Development Setup  "
echo "===================================="

check_docker

# Check if containers are already running
if is_container_running "crypto_tracker_redis" && is_container_running "crypto_tracker_redis_mcp_inspector"; then
    echo "✅ All containers are already running"
    check_container_health
else
    echo "🔄 Some containers are not running, starting them..."
    start_containers
    check_container_health
fi

echo ""
echo "🎉 Development environment is ready!"
echo "📍 Redis: localhost:6379"
echo "📍 MCP Inspector: localhost:6274"
echo "📍 MCP Inspector UI: localhost:6277"
echo ""
echo "💡 You can now run your SvelteKit development server"
echo "===================================="
