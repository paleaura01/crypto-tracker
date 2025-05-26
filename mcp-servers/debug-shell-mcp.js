#!/usr/bin/env node

/**
 * Debug Shell MCP Server
 * 
 * Provides shell command execution capabilities for debugging and development.
 * This server allows safe execution of shell commands with proper error handling.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

class DebugShellServer {
  constructor() {
    this.server = new Server(
      {
        name: 'debug-shell-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'run_shell_command',
            description: 'Execute a shell command and return the output. Use with caution.',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'The shell command to execute',
                },
                workingDirectory: {
                  type: 'string',
                  description: 'Working directory for the command (optional)',
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout in milliseconds (default: 30000)',
                  default: 30000,
                },
              },
              required: ['command'],
            },
          },
          {
            name: 'list_directory',
            description: 'List contents of a directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Directory path to list',
                },
                detailed: {
                  type: 'boolean',
                  description: 'Show detailed file information',
                  default: false,
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'check_file_exists',
            description: 'Check if a file or directory exists',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'File or directory path to check',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'get_current_directory',
            description: 'Get the current working directory',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },          {
            name: 'get_environment_variable',
            description: 'Get an environment variable value',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Environment variable name',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'tail_debug_log',
            description: 'Tail the debug-stream.log file to monitor real-time debug events',
            inputSchema: {
              type: 'object',
              properties: {
                lines: {
                  type: 'number',
                  description: 'Number of recent lines to show (default: 20)',
                  default: 20,
                },
                follow: {
                  type: 'boolean',
                  description: 'Follow the log file for new entries (default: false)',
                  default: false,
                },
              },
            },
          },
          {
            name: 'parse_debug_events',
            description: 'Parse and analyze debug log events by type',
            inputSchema: {
              type: 'object',
              properties: {
                eventType: {
                  type: 'string',
                  description: 'Filter by event type (REFRESH_DETECTED, SAVE_START, SAVE_COMPLETE, etc.)',
                },
                since: {
                  type: 'string',
                  description: 'Show events since timestamp (ISO format)',
                },
                count: {
                  type: 'number',
                  description: 'Maximum number of events to return (default: 50)',
                  default: 50,
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'run_shell_command':
            return await this.runShellCommand(args);
          case 'list_directory':
            return await this.listDirectory(args);
          case 'check_file_exists':
            return await this.checkFileExists(args);
          case 'get_current_directory':
            return await this.getCurrentDirectory();          case 'get_environment_variable':
            return await this.getEnvironmentVariable(args);
          case 'tail_debug_log':
            return await this.tailDebugLog(args);
          case 'parse_debug_events':
            return await this.parseDebugEvents(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
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
  }

  async runShellCommand(args) {
    const { command, workingDirectory, timeout = 30000 } = args;

    try {
      const options = {
        timeout,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      };

      if (workingDirectory) {
        options.cwd = workingDirectory;
      }

      const { stdout, stderr } = await execAsync(command, options);

      let result = '';
      if (stdout) {
        result += `STDOUT:\n${stdout}\n`;
      }
      if (stderr) {
        result += `STDERR:\n${stderr}\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: result || 'Command executed successfully with no output.',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Command failed: ${error.message}\nSTDOUT: ${error.stdout || 'None'}\nSTDERR: ${error.stderr || 'None'}`,
          },
        ],
      };
    }
  }

  async listDirectory(args) {
    const { path: dirPath, detailed = false } = args;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      let result = `Contents of ${dirPath}:\n`;

      if (detailed) {
        for (const entry of entries) {
          const stats = await fs.stat(path.join(dirPath, entry.name));
          const type = entry.isDirectory() ? 'DIR' : 'FILE';
          const size = entry.isFile() ? stats.size : '-';
          const modified = stats.mtime.toISOString();
          result += `${type.padEnd(4)} ${size.toString().padStart(10)} ${modified} ${entry.name}\n`;
        }
      } else {
        for (const entry of entries) {
          const type = entry.isDirectory() ? '/' : '';
          result += `${entry.name}${type}\n`;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to list directory: ${error.message}`,
          },
        ],
      };
    }
  }

  async checkFileExists(args) {
    const { path: filePath } = args;

    try {
      const stats = await fs.stat(filePath);
      const type = stats.isDirectory() ? 'directory' : 'file';
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ ${filePath} exists (${type})`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ ${filePath} does not exist`,
          },
        ],
      };
    }
  }

  async getCurrentDirectory() {
    const cwd = process.cwd();
    return {
      content: [
        {
          type: 'text',
          text: `Current working directory: ${cwd}`,
        },
      ],
    };
  }
  async getEnvironmentVariable(args) {
    const { name } = args;
    const value = process.env[name];

    return {
      content: [
        {
          type: 'text',
          text: value 
            ? `${name}=${value}` 
            : `Environment variable '${name}' is not set`,
        },
      ],
    };
  }

  async tailDebugLog(args) {
    const { lines = 20, follow = false } = args;
    const debugLogPath = path.join(process.cwd(), 'static', 'data', 'debug-stream.log');

    try {
      // Check if debug log exists
      await fs.access(debugLogPath);

      if (follow) {
        return {
          content: [
            {
              type: 'text',
              text: '🔄 Starting live debug log monitoring...\nNote: Use the shell command "tail -f" for continuous monitoring:\ntail -f static/data/debug-stream.log',
            },
          ],
        };
      } else {
        // Read the last N lines
        const content = await fs.readFile(debugLogPath, 'utf-8');
        const logLines = content.trim().split('\n');
        const recentLines = logLines.slice(-lines);

        let result = `📋 Last ${lines} debug log entries:\n`;
        result += '═'.repeat(50) + '\n';
        
        recentLines.forEach((line, index) => {
          if (line.trim()) {
            // Parse and format the log line
            const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] (.+)$/);
            if (match) {
              const [, timestamp, eventType, message] = match;
              const time = new Date(timestamp).toLocaleTimeString();
              result += `${time} [${eventType}] ${message}\n`;
            } else {
              result += line + '\n';
            }
          }
        });

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Could not read debug log: ${error.message}\nPath: ${debugLogPath}`,
          },
        ],
      };
    }
  }

  async parseDebugEvents(args) {
    const { eventType, since, count = 50 } = args;
    const debugLogPath = path.join(process.cwd(), 'static', 'data', 'debug-stream.log');

    try {
      const content = await fs.readFile(debugLogPath, 'utf-8');
      const logLines = content.trim().split('\n').filter(line => line.trim());

      let events = [];
      const sinceDate = since ? new Date(since) : null;

      for (const line of logLines) {
        const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] (.+)$/);
        if (match) {
          const [, timestamp, type, message] = match;
          const eventDate = new Date(timestamp);

          // Filter by date if specified
          if (sinceDate && eventDate < sinceDate) continue;
          
          // Filter by event type if specified
          if (eventType && type !== eventType) continue;

          events.push({
            timestamp: eventDate,
            type,
            message,
            time: eventDate.toLocaleTimeString(),
          });
        }
      }

      // Sort by timestamp (most recent first) and limit
      events.sort((a, b) => b.timestamp - a.timestamp);
      events = events.slice(0, count);

      // Group events by type for summary
      const eventCounts = {};
      events.forEach(event => {
        eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      });

      let result = `📊 Debug Event Analysis\n`;
      result += '═'.repeat(40) + '\n';
      
      if (eventType) {
        result += `🔍 Filtered by: ${eventType}\n`;
      }
      if (since) {
        result += `📅 Since: ${new Date(since).toLocaleString()}\n`;
      }
      result += `📈 Total events: ${events.length}\n\n`;

      // Event type summary
      result += '📋 Event Type Summary:\n';
      for (const [type, count] of Object.entries(eventCounts)) {
        result += `  ${type}: ${count} events\n`;
      }
      result += '\n';

      // Recent events
      result += `🕒 Recent Events (last ${Math.min(events.length, 10)}):\n`;
      result += '-'.repeat(40) + '\n';
      
      events.slice(0, 10).forEach(event => {
        result += `${event.time} [${event.type}] ${event.message}\n`;
      });

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Could not parse debug events: ${error.message}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Debug Shell MCP Server running on stdio');
  }
}

const server = new DebugShellServer();
server.run().catch(console.error);
