#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMcpServer() {
  const url = process.argv[2] || 'http://localhost:5173/api/mcp';
  
  console.log(`Testing MCP server at: ${url}`);
  
  try {
    // Test HTTP endpoint directly
    const response = await fetch(`${url}/http`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      })
    });
    
    const data = await response.json();
    console.log('Available tools:', JSON.stringify(data, null, 2));
    
    // Test a tool call
    const priceResponse = await fetch(`${url}/http`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get_crypto_price',
          arguments: {
            symbol: 'bitcoin'
          }
        }
      })
    });
    
    const priceData = await priceResponse.json();
    console.log('Bitcoin price result:', JSON.stringify(priceData, null, 2));
    
  } catch (error) {
    console.error('Error testing MCP server:', error);
  }
}

testMcpServer();
