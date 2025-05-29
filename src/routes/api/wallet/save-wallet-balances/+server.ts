import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { address, balances } = await request.json();
    if (!address || !balances) {
      return json({ error: 'Missing address or balances' }, { status: 400 });
    }    // Save to organized tmp directory for runtime cache files
    const fileName = `wallet-balances-${address.toLowerCase()}.json`;
    const cacheFilePath = join(process.cwd(), 'tmp', 'wallet-balances', fileName);
    const staticFilePath = join(process.cwd(), 'static', 'data', fileName);
    
    // Ensure both directories exist
    await mkdir(join(process.cwd(), 'tmp', 'wallet-balances'), { recursive: true });
    await mkdir(join(process.cwd(), 'static', 'data'), { recursive: true });
    
    // Write to both locations
    const dataString = JSON.stringify(balances, null, 2);
    await Promise.all([
      writeFile(cacheFilePath, dataString),      writeFile(staticFilePath, dataString)  // For client-side access
    ]);
    
    return json({
      success: true, 
      message: `Saved ${balances.length} tokens for ${address}`,
      cacheFilePath,
      staticFilePath
    });  } catch {
    return json({ error: 'Failed to save wallet balances' }, { status: 500 });
  }
}
