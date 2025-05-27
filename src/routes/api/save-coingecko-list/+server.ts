import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Save to static/data directory (static files don't trigger hot reload)
    const filePath = join(process.cwd(), 'static', 'data', 'coingecko-list.json');
    
    // Ensure directory exists
    await mkdir(join(process.cwd(), 'static', 'data'), { recursive: true });

    // Write to file
    await writeFile(filePath, JSON.stringify(data, null, 2));
    
    console.log('✅ CoinGecko list saved to:', filePath);
    return json({ success: true });
  } catch (error) {
    console.error('Error saving CoinGecko list:', error);
    return json({ success: false, error: String(error) }, { status: 500 });
  }
}
