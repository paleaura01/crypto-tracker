#!/bin/bash
# Start MCP Inspector for debugging MCP servers
# Usage: ./scripts/start-mcp-inspector.sh [server-name]
# Example: ./scripts/start-mcp-inspector.sh browser-tools

SERVER_NAME=${1:-"browser-tools"}
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case $SERVER_NAME in
    "browser-tools")
        echo "🔍 Starting MCP Inspector for Browser Tools..."
        cd "$ROOT_DIR/mcp-tools/inspector"
        npx @modelcontextprotocol/inspector node -- "$ROOT_DIR/mcp-servers/browser-tools-mcp/browser-tools-mcp/dist/mcp-server.js"
        ;;
    "fetch")
        echo "🔍 Starting MCP Inspector for Fetch..."
        cd "$ROOT_DIR/mcp-tools/inspector"
        npx @modelcontextprotocol/inspector node -- "$ROOT_DIR/mcp-servers/fetch-mcp/dist/index.js"
        ;;
    "solver")
        echo "🔍 Starting MCP Inspector for Solver..."
        cd "$ROOT_DIR/mcp-tools/inspector"
        npx @modelcontextprotocol/inspector uv -- --directory "$ROOT_DIR/mcp-servers/mcp-solver" run mcp-solver-z3
        ;;
    "cryptopanic")
        echo "🔍 Starting MCP Inspector for CryptoPanic..."
        cd "$ROOT_DIR/mcp-tools/inspector"
        export CRYPTOPANIC_API_KEY="4e52d7747b84b79651b23ed424f6ffdce627bea4"
        npx @modelcontextprotocol/inspector uv -- --directory "$ROOT_DIR/mcp-servers/cryptopanic-mcp-server" run main.py
        ;;
    "playwright")
        echo "🔍 Starting MCP Inspector for Playwright..."
        cd "$ROOT_DIR/mcp-tools/inspector"
        npx @modelcontextprotocol/inspector npx -- -y @executeautomation/playwright-mcp-server
        ;;
    "windows-cli")
        echo "🔍 Starting MCP Inspector for Windows CLI..."
        cd "$ROOT_DIR/mcp-tools/inspector"
        npx @modelcontextprotocol/inspector npx -- -y @simonb97/server-win-cli
        ;;
    *)
        echo "❌ Unknown server: $SERVER_NAME"
        echo "Available servers: browser-tools, fetch, solver, cryptopanic, playwright, windows-cli"
        exit 1
        ;;
esac
