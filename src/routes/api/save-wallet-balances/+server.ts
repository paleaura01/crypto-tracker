import { json } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST({ request }) {
  try {
    const { address, balances } = await request.json();
    if (!address || !balances) {
      return json({ error: 'Missing address or balances' }, { status: 400 });
    }
    
    // Save to static/data directory (static files don't trigger hot reload)
    const fileName = `wallet-balances-${address.toLowerCase()}.json`;
    const filePath = join(process.cwd(), 'static', 'data', fileName);
    
    // Ensure directory exists
    await mkdir(join(process.cwd(), 'static', 'data'), { recursive: true });
    
    // Write to file
    await writeFile(filePath, JSON.stringify(balances, null, 2));
    
    console.log(`💾 Saved wallet balances for ${address} to ${filePath}`);
    return json({ 
      success: true, 
      message: `Saved ${balances.length} tokens for ${address}`,
      filePath
    });
  } catch (error) {
    console.error('❌ Error saving wallet balances:', error);
    return json({ error: 'Failed to save wallet balances' }, { status: 500 });
  }
}
