#!/bin/bash
# Start Browser Tools Server for debugging MCP servers
# Usage: ./scripts/start-browser-server.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🌐 Starting Browser Tools Server..."
echo "📂 Server location: $ROOT_DIR/mcp-servers/browser-tools-mcp/browser-tools-server"

cd "$ROOT_DIR/mcp-servers/browser-tools-mcp/browser-tools-server"

# Check if the dist folder exists
if [ ! -d "dist" ]; then
    echo "⚠️  Dist folder not found. Building server..."
    npm run build
fi

echo "🚀 Starting server on http://localhost:3000"
echo "💡 Make sure to install the Chrome extension from:"
echo "   https://github.com/AgentDeskAI/browser-tools-mcp/releases/download/v1.2.0/BrowserTools-1.2.0-extension.zip"
echo ""
echo "🔧 To stop the server, press Ctrl+C"

node dist/browser-connector.js
