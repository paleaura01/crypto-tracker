import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const logData = await request.json();
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const filename = `debug-${logData.type || 'unknown'}-${timestamp}.json`;
		const filepath = join('static', 'data', filename);
				// Also append to a master debug log
		const masterLogPath = join('static', 'data', 'debug-master.json');
		let masterLog: any[] = [];
		
		if (existsSync(masterLogPath)) {
			try {
				const content = readFileSync(masterLogPath, 'utf-8');
				masterLog = JSON.parse(content);
			} catch (e) {
				console.log('Creating new master debug log');
			}
		}
		
		// Add timestamp and ensure we have the event data
		const logEntry = {
			timestamp: new Date().toISOString(),
			filename,
			...logData
		};
		
		// Save individual log file
		writeFileSync(filepath, JSON.stringify(logEntry, null, 2));
		
		// Append to master log (keep last 100 entries)
		masterLog.push(logEntry);
		if (masterLog.length > 100) {
			masterLog = masterLog.slice(-100);
		}
		writeFileSync(masterLogPath, JSON.stringify(masterLog, null, 2));
		
		return json({ 
			success: true, 
			message: 'Debug log saved',
			filename,
			entry: logEntry
		});
	} catch (error) {
		console.error('Failed to save debug log:', error);
		return json({ 
			success: false, 
			error: error.message 
		}, { status: 500 });
	}
}
