#!/bin/bash
# Production build script - Builds Docker images and prepares for deployment

echo "🏗️ Starting Crypto Tracker Production Build..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Stop development containers if running
echo "🛑 Stopping development containers..."
docker-compose down

# Build SvelteKit application
echo "📦 Building SvelteKit application..."
npm run prepare && npm run build

if [ $? -ne 0 ]; then
    echo "❌ SvelteKit build failed"
    exit 1
fi

echo "✅ SvelteKit build complete"

# Build production Docker images
echo "🐳 Building production Docker images..."

# Build MCP Inspector production image
docker build -f Dockerfile.mcp-inspector -t crypto-tracker-mcp:latest .

if [ $? -ne 0 ]; then
    echo "❌ Failed to build MCP Inspector Docker image"
    exit 1
fi

echo "✅ MCP Inspector image built successfully"

# Show built images
echo "📊 Built Images:"
docker images --filter "reference=crypto-tracker*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

echo ""
echo "🎯 Production Commands:"
echo "   - Start Redis: docker run -d --name redis -p 6379:6379 redis:latest"
echo "   - Start MCP Inspector: docker run -d --name mcp-inspector -p 6274:6274 crypto-tracker-mcp:latest"
echo "   - Deploy SvelteKit: npm run preview (or deploy /build folder)"
echo ""
echo "✅ Production build complete!"
