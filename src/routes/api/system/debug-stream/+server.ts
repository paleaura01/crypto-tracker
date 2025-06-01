import type { RequestHandler } from '@sveltejs/kit';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Simple streaming debug endpoint - writes one line at a time to a file
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { entry, timestamp, type, message } = await request.json();
    
    // Ensure logs directory exists
    const logsDir = join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    
    // Use the formatted entry if provided, otherwise format it
    const logLine = entry || `[${timestamp}] ${type}: ${message}\n`;
    
    // Append to debug stream log file in logs directory
    const streamLogPath = join(logsDir, 'debug-stream.log');
    
    try {
      // Simple append - much more efficient than JSON manipulation
      writeFileSync(streamLogPath, logLine, { flag: 'a' });
    } catch {
      // If file doesn't exist, create it
      writeFileSync(streamLogPath, logLine);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Debug stream write error:', error);
    return new Response(JSON.stringify({ error: 'Failed to write debug stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
