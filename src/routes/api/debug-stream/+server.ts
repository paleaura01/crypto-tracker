import type { RequestHandler } from './$types';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Simple streaming debug endpoint - writes one line at a time to a file
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { event } = await request.json();
    
    // Ensure debug directory exists
    const debugDir = join(process.cwd(), 'static', 'data');
    if (!existsSync(debugDir)) {
      mkdirSync(debugDir, { recursive: true });
    }
    
    // Simple one-line format for streaming
    const logLine = `${event.timestamp} [${event.type}] ${event.message}\n`;
    
    // Append to a simple stream log file
    const streamLogPath = join(debugDir, 'debug-stream.log');
    
    try {
      // Simple append - much more efficient than JSON manipulation
      writeFileSync(streamLogPath, logLine, { flag: 'a' });
    } catch (e) {
      // If file doesn't exist, create it
      writeFileSync(streamLogPath, logLine);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Debug stream error:', error);
    return new Response(JSON.stringify({ error: 'Failed to write debug stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
