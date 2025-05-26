#!/usr/bin/env node

/**
 * Coinbase AgentKit MCP Server
 * Provides blockchain operations through Coinbase Developer Platform
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Dynamic imports to handle ESM/CommonJS compatibility
let getMcpTools, AgentKit;

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
dotenv.config({ path: join(projectRoot, '.env') });

// Global variables
let agentKit;
let mcpTools;

// Create the MCP server
const server = new Server(
  {
    name: "coinbase-agentkit-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize AgentKit and MCP tools
async function initializeAgentKit() {
  try {
    console.error('🚀 Initializing Coinbase AgentKit MCP Server...');
    
    // Dynamic imports to avoid ESM/CommonJS issues
    if (!getMcpTools || !AgentKit) {
      console.error('📦 Loading AgentKit modules dynamically...');
      const agentKitModule = await import("@coinbase/agentkit");
      const mcpModule = await import("@coinbase/agentkit-model-context-protocol");
      
      AgentKit = agentKitModule.AgentKit;
      getMcpTools = mcpModule.getMcpTools;
      console.error('✅ AgentKit modules loaded successfully');
    }
    
    // Check if environment variables are available
    if (!process.env.CDP_API_KEY_NAME || !process.env.CDP_API_KEY_PRIVATE_KEY) {
      throw new Error('CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables are required');
    }
    
    // Initialize AgentKit with your CDP API keys from environment
    agentKit = await AgentKit.from({
      cdpApiKeyName: process.env.CDP_API_KEY_NAME,
      cdpApiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
    });
    
    console.error('✅ AgentKit initialized successfully');

    // Retrieve MCP-compatible tools from AgentKit
    const toolsResult = await getMcpTools(agentKit);
    mcpTools = toolsResult;
    
    console.error(`🔧 Loaded ${toolsResult.tools.length} AgentKit tools`);
    console.error("Coinbase AgentKit MCP server initialized successfully");
  } catch (error) {
    console.error(`Failed to initialize AgentKit: ${error.message}`);
    throw error;
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  if (!mcpTools) {
    await initializeAgentKit();
  }
  
  return {
    tools: mcpTools.tools || []
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!mcpTools) {
    await initializeAgentKit();
  }
  
  const { name, arguments: args } = request.params;
  
  try {
    // Use the toolHandler from getMcpTools
    const result = await mcpTools.toolHandler(name, args);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text", 
          text: `Error executing tool '${name}': ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Coinbase AgentKit MCP server running on stdio");
  } catch (error) {
    console.error("Server error:", error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Server startup error:", error);
  process.exit(1);
});
