#!/bin/bash

# Production Build Script - Builds Docker images and prepares for production deployment

echo "🏗️  Starting production build process..."

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to build production Docker images
build_production_images() {
    echo "🔨 Building production Docker images..."
    
    # Build the MCP Inspector production image
    echo "📦 Building MCP Inspector production image..."
    docker build -f Dockerfile.mcp-inspector -t crypto-tracker-mcp:latest . || {
        echo "❌ Failed to build MCP Inspector image"
        exit 1
    }
    echo "✅ MCP Inspector production image built successfully"
    
    # Build SvelteKit production image (if Dockerfile exists)
    if [ -f "Dockerfile" ]; then
        echo "📦 Building SvelteKit production image..."
        docker build -t crypto-tracker-app:latest . || {
            echo "❌ Failed to build SvelteKit app image"
            exit 1
        }
        echo "✅ SvelteKit production image built successfully"
    fi
}

# Function to build SvelteKit application
build_svelte_app() {
    echo "⚡ Building SvelteKit application..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    # Run SvelteKit build
    npm run build || {
        echo "❌ SvelteKit build failed"
        exit 1
    }
    echo "✅ SvelteKit application built successfully"
}

# Function to create production docker-compose file
create_production_compose() {
    echo "📝 Creating production docker-compose configuration..."
    
    cat > docker-compose.prod.yml << 'EOF'
services:
  redis:
    image: redis:latest
    container_name: crypto_tracker_redis_prod
    ports:
      - "6379:6379"
    volumes:
      - redis_data_prod:/data
    command: redis-server --appendonly yes
    restart: unless-stopped
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD:-}

  mcp-inspector:
    image: crypto-tracker-mcp:latest
    container_name: crypto_tracker_mcp_inspector_prod
    ports:
      - "6274:6274"
      - "6277:6277"
    depends_on:
      - redis
    restart: unless-stopped
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - NODE_ENV=production

volumes:
  redis_data_prod:
EOF

    echo "✅ Production docker-compose configuration created"
}

# Function to show deployment instructions
show_deployment_info() {
    echo ""
    echo "🎉 Production build completed successfully!"
    echo "===================================="
    echo "📦 Built Docker Images:"
    docker images | grep crypto-tracker
    echo ""
    echo "🚀 Deployment Options:"
    echo ""
    echo "1️⃣  Local Production Test:"
    echo "   docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "2️⃣  Deploy to Server:"
    echo "   • Push images to registry: docker push crypto-tracker-mcp:latest"
    echo "   • Copy docker-compose.prod.yml to server"
    echo "   • Run: docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "3️⃣  Vercel Deployment:"
    echo "   • npm run build output is ready in ./build/"
    echo "   • Use 'vercel deploy' for deployment"
    echo ""
    echo "📍 Production Ports:"
    echo "   • Redis: localhost:6379"
    echo "   • MCP Inspector: localhost:6274"
    echo "   • MCP Inspector UI: localhost:6277"
    echo "===================================="
}

# Function to cleanup development containers
cleanup_dev_containers() {
    echo "🧹 Cleaning up development containers..."
    docker-compose down || echo "No development containers to stop"
    echo "✅ Development containers stopped"
}

# Main execution
echo "===================================="
echo "  Crypto Tracker Production Build   "
echo "===================================="

check_docker
cleanup_dev_containers
build_svelte_app
build_production_images
create_production_compose
show_deployment_info
