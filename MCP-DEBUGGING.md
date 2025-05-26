# MCP Debugging Guide

## Overview
This document provides a comprehensive guide for debugging your Model Context Protocol (MCP) servers in the crypto-tracker project.

## 🔧 Debugging Tools Setup

### 1. MCP Inspector
The MCP Inspector provides an interactive debugging interface for testing MCP servers directly.

**Location**: `d:\Github\crypto-tracker\mcp-tools\inspector`

**Usage**:
```bash
# Debug specific servers
./scripts/start-mcp-inspector.sh browser-tools
./scripts/start-mcp-inspector.sh fetch
./scripts/start-mcp-inspector.sh solver
./scripts/start-mcp-inspector.sh cryptopanic
./scripts/start-mcp-inspector.sh playwright
./scripts/start-mcp-inspector.sh windows-cli
```

### 2. Browser Tools Server
The Browser Tools Server enables browser monitoring and interaction through a Chrome extension.

**Components**:
- **MCP Server**: Handles MCP protocol communication
- **Browser Server**: Manages Chrome extension communication
- **Chrome Extension**: Captures browser events and provides DevTools integration

**Setup**:
1. Install Chrome Extension from: [v1.2.0 Release](https://github.com/AgentDeskAI/browser-tools-mcp/releases/download/v1.2.0/BrowserTools-1.2.0-extension.zip)
2. Start the browser server: `./scripts/start-browser-server.sh`
3. The MCP server is automatically configured in `.vscode/mcp.json`

## 📊 Current MCP Server Status

### ✅ Working Servers (10/10)
1. **desktop-screenshot** - Custom local server for screenshots
2. **sequential-thinking** - Advanced reasoning capabilities  
3. **playwright** - Browser automation with DevTools access
4. **windows-cli** - Terminal/filesystem operations
5. **basic-memory** - Persistent memory across sessions
6. **supabase** - Database operations
7. **cryptopanic** - Crypto news from CryptoPanic API
8. **fetch** - Web scraping and content fetching
9. **solver** - Z3 constraint solving
10. **browser-tools** - NEW: Browser monitoring with Chrome DevTools integration

### 🔍 DevTools Access

#### Playwright MCP Server
- **DevTools**: ✅ Full Chrome DevTools access
- **Features**: Page debugging, console logs, network monitoring, performance profiling
- **Usage**: Automated browser testing and debugging

#### Browser Tools MCP Server  
- **DevTools**: ✅ Chrome extension with integrated DevTools panel
- **Features**: 
  - Real-time browser monitoring
  - Screenshot capture with auto-paste to Cursor
  - Lighthouse SEO/performance analysis
  - Debug mode with comprehensive tool execution
  - Audit mode for accessibility and best practices
- **Chrome Extension**: Provides dedicated DevTools panel

## 🚀 Quick Start Commands

### Start Debugging Session
```bash
# 1. Start browser tools server (required for Chrome extension)
./scripts/start-browser-server.sh

# 2. In another terminal, start MCP Inspector for any server
./scripts/start-mcp-inspector.sh browser-tools
```

### Test Individual Servers
```bash
# Test browser tools functionality
./scripts/start-mcp-inspector.sh browser-tools

# Test web scraping capabilities  
./scripts/start-mcp-inspector.sh fetch

# Test constraint solving
./scripts/start-mcp-inspector.sh solver

# Test crypto news fetching
./scripts/start-mcp-inspector.sh cryptopanic
```

## 🛠️ Troubleshooting

### Common Issues

1. **MCP Server Not Starting**
   - Check if all dependencies are installed
   - Verify file paths in `.vscode/mcp.json`
   - Use MCP Inspector to test individual servers

2. **Browser Tools Not Connecting**
   - Ensure Chrome extension is installed and enabled
   - Start browser server before using MCP server
   - Check if port 3000 is available

3. **DevTools Not Available**
   - For Playwright: Built-in DevTools access
   - For Browser Tools: Install Chrome extension first

### Log Locations
- **Browser Server Logs**: Console output from `./scripts/start-browser-server.sh`
- **MCP Inspector Logs**: Console output from inspector sessions
- **VS Code MCP Logs**: Check VS Code Developer Tools

## 📋 MCP Configuration

Current configuration in `.vscode/mcp.json`:
- All servers properly configured with correct paths
- Environment variables set for API keys
- Browser tools server added with local build path

## 🔄 Development Workflow

1. **Debug Server Issues**: Use MCP Inspector
2. **Browser Debugging**: Use Browser Tools with Chrome extension
3. **Integration Testing**: Test through VS Code MCP integration
4. **Performance Monitoring**: Use Lighthouse tools in browser-tools

## 📚 Additional Resources

- [MCP Inspector Guide](https://modelcontextprotocol.io/docs/tools/debugging)
- [Browser Tools Documentation](https://browsertools.agentdesk.ai/)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
