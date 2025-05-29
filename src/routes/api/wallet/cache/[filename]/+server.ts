// src/routes/api/wallet/cache/[filename]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { filename } = params;
    
    if (!filename || !filename.endsWith('.json')) {
      return json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Read from tmp/wallet-balances directory
    const filePath = join(process.cwd(), 'tmp', 'wallet-balances', filename);
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    return json(data);  } catch (error: unknown) {
    // Return 404 if file not found, otherwise return error
    const isFileNotFound = error instanceof Error && 'code' in error && error.code === 'ENOENT';
    const status = isFileNotFound ? 404 : 500;
    return json({ error: 'Cache file not found' }, { status });
  }
};
