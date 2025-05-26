import { json } from '@sveltejs/kit';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST({ request }) {  try {
    const overrides = await request.json();
    
    // Save to static/data/symbol-overrides.json (static files don't trigger hot reload)
    const filePath = join(process.cwd(), 'static', 'data', 'symbol-overrides.json');
    await writeFile(filePath, JSON.stringify(overrides, null, 2));
    
    console.log('✅ Symbol overrides saved to:', filePath);
    return json({ success: true, message: 'Symbol overrides saved successfully' });
  } catch (error: any) {
    console.error('❌ Failed to save symbol overrides:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
