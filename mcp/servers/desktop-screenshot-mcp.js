#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const server = new Server(
  {
    name: 'desktop-screenshot-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'capture_desktop',
        description: 'Take a screenshot of the entire Windows desktop',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Filename to save the screenshot (without extension)',
              default: 'desktop-screenshot',
            },
          },
        },
      },
    ],
  };
});

// Call tools
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  console.error(`Tool called: ${req.name}`);

  try {    if (req.name === 'capture_desktop') {
      const filename = req.arguments?.filename || 'desktop-screenshot';
      const outputPath = path.join('d:', 'Github', 'crypto-tracker', 'static', 'data', `${filename}.png`);
        // Use the PowerShell script file instead of inline command
      const scriptPath = path.join('d:', 'Github', 'crypto-tracker', 'take-screenshot.ps1');
      const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -filename "${filename}"`;

      console.error(`Executing command: ${command}`);
      console.error(`Script path: ${scriptPath}`);
      console.error(`Expected output path: ${outputPath}`);

      return new Promise((resolve) => {
        exec(command, async (error, stdout, stderr) => {
          console.error(`Command execution completed:`);
          console.error(`Error: ${error}`);
          console.error(`STDOUT: ${stdout}`);
          console.error(`STDERR: ${stderr}`);
          if (error) {
            console.error(`Error taking screenshot: ${error.message}`);
            resolve({
              content: [
                {
                  type: 'text',
                  text: `ERROR taking screenshot: ${error.message}\\nSTDOUT: ${stdout}\\nSTDERR: ${stderr}`,
                },
              ],
            });
            return;
          }

          try {
            // Check if the file exists
            await fs.access(outputPath);
            console.error(`Screenshot saved to ${outputPath}`);
            // const imageBase64 = await fs.readFile(outputPath, { encoding: 'base64' });
            resolve({
              content: [
                {
                  type: 'text',
                  text: `Desktop screenshot saved successfully to ${outputPath}. You can view it at file://${outputPath}`,
                },
                // Uncomment these lines to show image directly in chat
                {
                  type: 'image',
                  data: await fs.readFile(outputPath, { encoding: 'base64' }),
                  mimeType: 'image/png',
                }
              ],
            });
          } catch (err) {
            console.error(`Failed to save or access screenshot: ${err.message}`);
            resolve({
              content: [
                {
                  type: 'text',
                  text: `Failed to save or access screenshot: ${err.message}`,
                },
              ],
            });
          }
        });
      });
    }

    // Handle unknown tools
    return {
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${req.name}`,
        },
      ],
    };
  } catch (error) {
    console.error(`Error handling tool call: ${error.message}`);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Desktop Screenshot MCP server running on stdio');
  console.error('Working directory:', process.cwd());
  
  // Keep the process alive
  process.stdin.resume();
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
