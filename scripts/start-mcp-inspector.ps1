# Start MCP Inspector for debugging MCP servers
# Usage: .\scripts\start-mcp-inspector.ps1 [server-name]
# Example: .\scripts\start-mcp-inspector.ps1 browser-tools

param(
    [string]$ServerName = "browser-tools"
)

$rootDir = Split-Path -Parent $PSScriptRoot

switch ($ServerName) {
    "browser-tools" {
        Write-Host "🔍 Starting MCP Inspector for Browser Tools..." -ForegroundColor Cyan
        Set-Location "$rootDir\mcp-tools\inspector"
        npx @modelcontextprotocol/inspector node -- "$rootDir\mcp-servers\browser-tools-mcp\browser-tools-mcp\dist\mcp-server.js"
    }
    "fetch" {
        Write-Host "🔍 Starting MCP Inspector for Fetch..." -ForegroundColor Cyan
        Set-Location "$rootDir\mcp-tools\inspector"
        npx @modelcontextprotocol/inspector node -- "$rootDir\mcp-servers\fetch-mcp\dist\index.js"
    }
    "solver" {
        Write-Host "🔍 Starting MCP Inspector for Solver..." -ForegroundColor Cyan
        Set-Location "$rootDir\mcp-tools\inspector"
        npx @modelcontextprotocol/inspector uv -- --directory "$rootDir\mcp-servers\mcp-solver" run mcp-solver-z3
    }
    "cryptopanic" {
        Write-Host "🔍 Starting MCP Inspector for CryptoPanic..." -ForegroundColor Cyan
        Set-Location "$rootDir\mcp-tools\inspector"
        $env:CRYPTOPANIC_API_KEY = "4e52d7747b84b79651b23ed424f6ffdce627bea4"
        npx @modelcontextprotocol/inspector uv -- --directory "$rootDir\mcp-servers\cryptopanic-mcp-server" run main.py
    }
    default {
        Write-Host "❌ Unknown server: $ServerName" -ForegroundColor Red
        Write-Host "Available servers: browser-tools, fetch, solver, cryptopanic" -ForegroundColor Yellow
    }
}
