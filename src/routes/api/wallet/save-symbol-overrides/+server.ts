import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {  try {
    const overrides = await request.json();
    
    // Save to both organized data structure and static for client access
    const srcFilePath = join(process.cwd(), 'src', 'data', 'overrides', 'symbol-overrides.json');
    const staticFilePath = join(process.cwd(), 'static', 'data', 'symbol-overrides.json');
    
    // Ensure directories exist
    await mkdir(join(process.cwd(), 'src', 'data', 'overrides'), { recursive: true });
    await mkdir(join(process.cwd(), 'static', 'data'), { recursive: true });
    
    // Write to both locations
    const dataString = JSON.stringify(overrides, null, 2);
    await Promise.all([
      writeFile(srcFilePath, dataString),
      writeFile(staticFilePath, dataString)    ]);
    
    return json({ success: true, message: 'Symbol overrides saved successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ success: false, error: message }, { status: 500 });
  }
}
