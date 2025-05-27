import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const overrides = await request.json();
    
    // Save to static/data/address-overrides.json (static files don't trigger hot reload)
    const filePath = join(process.cwd(), 'static', 'data', 'address-overrides.json');
    await writeFile(filePath, JSON.stringify(overrides, null, 2));
    
    console.log('✅ Address overrides saved to:', filePath);
    return json({ success: true, message: 'Address overrides saved successfully' });
  } catch (error: any) {
    console.error('❌ Failed to save address overrides:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
