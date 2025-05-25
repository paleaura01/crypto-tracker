import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export async function POST({ request }) {
  try {
    const data = await request.json();
    const filePath = path.join(process.cwd(), 'src', 'data', 'coingecko-list.json');
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(data));
    
    return json({ success: true });
  } catch (error) {
    console.error('Error saving CoinGecko list:', error);
    return json({ success: false, error: String(error) }, { status: 500 });
  }
}
