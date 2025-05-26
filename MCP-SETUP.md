# MCP Server Setup Documentation

## Overview
This document provides complete setup instructions for the Model Context Protocol (MCP) server environment in the crypto-tracker project.

## 🎯 Configured MCP Servers

### ✅ Working Servers

1. **Sequential Thinking MCP Server**
   - **Purpose**: Advanced reasoning and problem-solving capabilities
   - **Status**: ✅ Operational
   - **Command**: `npx -y @modelcontextprotocol/server-sequential-thinking`

2. **Persistent Memory MCP Server**
   - **Purpose**: Store and retrieve information across sessions
   - **Status**: ✅ Operational, tested with entity storage
   - **Command**: `npx -y @modelcontextprotocol/server-memory`

3. **Supabase MCP Server**
   - **Purpose**: Database queries and management
   - **Status**: ✅ Operational, connected to database
   - **Command**: `npx -y @supabase/mcp-server-supabase@latest`
   - **Authentication**: Access token configured

4. **Filesystem MCP Server**
   - **Purpose**: File operations within workspace
   - **Status**: ✅ Operational
   - **Command**: `npx -y @modelcontextprotocol/server-filesystem ${workspaceFolder}`

5. **Puppeteer MCP Server**
   - **Purpose**: Browser automation and web scraping
   - **Status**: ✅ Operational
   - **Command**: `npx -y @modelcontextprotocol/server-puppeteer`

6. **Desktop Screenshot MCP Server**
   - **Purpose**: Screen capture and visual testing
   - **Status**: ✅ Operational (custom local server)
   - **Command**: `node d:\\Github\\crypto-tracker\\mcp-servers\\desktop-screenshot-mcp.js`

7. **CodeLogic MCP Server**
   - **Purpose**: Code analysis and dependency tracking
   - **Status**: ✅ Installed, requires credentials
   - **Command**: `uvx codelogic-mcp-server@latest`
   - **Prerequisites**: Astral UV (installed)

### ⚠️ Pending Configuration

8. **Coinbase AgentKit MCP Server**
   - **Purpose**: Cryptocurrency operations via Coinbase API
   - **Status**: ❌ Module compatibility issues (ESM/CommonJS)
   - **Command**: `node d:\\Github\\crypto-tracker\\mcp-servers\\coinbase-agentkit-mcp.js`
   - **Issue**: Requires resolution of jose library compatibility

## 🔧 Installation Instructions

### Prerequisites
1. **Node.js** (v18 or higher)
2. **npm** (latest version)
3. **Astral UV** (for CodeLogic server)

### Quick Setup
```powershell
# Clone and setup project
git clone <repo-url>
cd crypto-tracker

# Install dependencies
npm install

# Setup environment variables (see .env section below)
# Configure MCP servers (already done in .vscode/mcp.json)

# Test the setup
.\dev-enhanced.ps1 -TestOnly
```

## 📁 Configuration Files

### MCP Configuration (`.vscode/mcp.json`)
```json
{
  "servers": {
    "desktop-screenshot": {
      "command": "node",
      "args": ["d:\\Github\\crypto-tracker\\mcp-servers\\desktop-screenshot-mcp.js"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "supabase": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest", "--access-token", "sbp_..."]
    },
    "coinbase-agentkit": {
      "command": "node",
      "args": ["d:\\Github\\crypto-tracker\\mcp-servers\\coinbase-agentkit-mcp.js"]
    },
    "codelogic-mcp-server": {
      "command": "C:\\Users\\Joshua\\.local\\bin\\uvx.exe",
      "args": ["codelogic-mcp-server@latest"],
      "env": {
        "CODELOGIC_SERVER_HOST": "https://your-company.app.codelogic.com",
        "CODELOGIC_USERNAME": "your-username",
        "CODELOGIC_PASSWORD": "your-password",
        "CODELOGIC_WORKSPACE_NAME": "your-workspace",
        "CODELOGIC_DEBUG_MODE": "true"
      }
    }
  }
}
```

### Environment Variables (`.env`)
```bash
# Supabase Configuration
SUPABASE_ACCESS_TOKEN=sbp_c2b0d43c77c535a225df7a10322805612843bc74

# Coinbase CDP API Keys
CDP_API_KEY_NAME=045fe4fa-eb85-4434-89fd-675dd7421885
CDP_API_KEY_PRIVATE_KEY=KYXAJBMImmyf78OGQ9+Fg8304uxnwlPzkcRk2DdT8jJuwhgmYOxXo6JBUCIP99tXrtoZygey/68C5Ie3svgi1Q==

# CodeLogic Configuration (Update these with your credentials)
CODELOGIC_SERVER_HOST=https://your-company.app.codelogic.com
CODELOGIC_USERNAME=your-username
CODELOGIC_PASSWORD=your-password
CODELOGIC_WORKSPACE_NAME=your-workspace
```

## 🧪 Testing and Validation

### Using the Enhanced Development Script
```powershell
# Test all MCP servers
.\dev-enhanced.ps1 -TestOnly

# Start with MCP testing
.\dev-enhanced.ps1 -TestMCP

# Start in verbose mode with detailed testing
.\dev-enhanced.ps1 -Verbose

# Start without opening browser
.\dev-enhanced.ps1 -SkipBrowser

# Start on custom port
.\dev-enhanced.ps1 -Port 3000
```

### Manual Testing Commands
```powershell
# Test Astral UV
~/.local/bin/uv --version

# Test CodeLogic server download (will fail without credentials)
~/.local/bin/uvx codelogic-mcp-server@latest --help

# Test Supabase connection
npx @supabase/mcp-server-supabase@latest --access-token YOUR_TOKEN

# Test Node MCP servers
npx -y @modelcontextprotocol/server-sequential-thinking
```

## 🔍 Troubleshooting

### Common Issues

1. **CodeLogic Server Authentication**
   - Update credentials in `.vscode/mcp.json` environment variables
   - Ensure you have a valid CodeLogic account and workspace

2. **Coinbase AgentKit Module Issues**
   - ESM/CommonJS compatibility problem with jose library
   - Requires refactoring to use proper module imports

3. **Astral UV Not Found**
   - Install using: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Add to PATH: `source $HOME/.local/bin/env`

4. **Supabase Connection Issues**
   - Verify access token is valid
   - Check network connectivity to Supabase

### Log Files
- Development logs: `logs/dev-YYYY-MM-DD.log`
- MCP server logs: Check VS Code Developer Console
- Server output: Use `Receive-Job` command shown in dev script

## 📚 Server Capabilities

### Sequential Thinking
- Multi-step reasoning
- Problem decomposition
- Hypothesis generation and verification

### Persistent Memory
- Entity storage and retrieval
- Relationship tracking
- Session persistence

### Supabase
- Database queries
- Table management
- Real-time data access

### Filesystem
- File operations within workspace
- Directory navigation
- Content manipulation

### Puppeteer
- Browser automation
- Web scraping
- UI testing

### Desktop Screenshot
- Screen capture
- Visual regression testing
- UI documentation

### CodeLogic (when configured)
- Code impact analysis
- Dependency tracking
- Database entity relationships

### Coinbase AgentKit (pending fix)
- Cryptocurrency operations
- Wallet management
- Trading capabilities

## 🚀 Development Workflow

1. **Start Development Environment**
   ```powershell
   .\dev-enhanced.ps1 -TestMCP -Verbose
   ```

2. **Test MCP Servers**
   ```powershell
   .\dev-enhanced.ps1 -TestOnly
   ```

3. **Monitor Logs**
   ```powershell
   Get-Content logs\dev-$(Get-Date -Format 'yyyy-MM-dd').log -Wait
   ```

4. **Stop All Services**
   ```powershell
   # Use Ctrl+C in dev script, or manually:
   Get-Process node | Stop-Process -Force
   ```

## 📝 Next Steps

1. **Fix Coinbase Integration**: Resolve ESM/CommonJS module compatibility
2. **Configure CodeLogic**: Add real credentials for code analysis
3. **Add More Servers**: Consider additional MCP servers for specific needs
4. **Automate Testing**: Integrate MCP testing into CI/CD pipeline
5. **Documentation**: Create server-specific usage guides

## 🔗 Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [VS Code MCP Extension](https://marketplace.visualstudio.com/items?itemName=modelcontextprotocol.mcp)
- [Astral UV Documentation](https://docs.astral.sh/uv/)
- [CodeLogic MCP Server](https://github.com/CodeLogicIncEngineering/codelogic-mcp-server)
- [Supabase MCP Server](https://github.com/supabase/mcp-server-supabase)

---

Last Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Project: Crypto Tracker MCP Environment
Status: 7/8 servers operational, 1 pending fix
