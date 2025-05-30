import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

export const GET: RequestHandler = async ({ url }) => {
	const ids = url.searchParams.get('ids');
	
	if (!ids) {
		throw error(400, 'Missing required parameter: ids');
	}

	// Split comma-separated IDs and validate
	const coinIds = ids.split(',').filter(id => id.trim());
	if (coinIds.length === 0) {
		throw error(400, 'No valid coin IDs provided');
	}

	// Limit to reasonable number of coins to avoid rate limiting
	if (coinIds.length > 100) {
		throw error(400, 'Too many coin IDs (max 100)');
	}

	try {
		const response = await fetch(
			`${COINGECKO_API_URL}?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`,
			{
				headers: {
					'User-Agent': 'Crypto-Tracker/1.0'
				}
			}
		);

		if (!response.ok) {
			if (response.status === 429) {
				throw error(429, 'Rate limited by CoinGecko API');
			}
			throw error(response.status, `CoinGecko API error: ${response.statusText}`);
		}

		const priceData = await response.json();
		
		// Validate response structure
		if (typeof priceData !== 'object' || priceData === null) {
			throw error(500, 'Invalid response from CoinGecko API');
		}

		return json(priceData);
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err; // Re-throw our custom errors
		}
				// Handle network errors
		throw error(500, 'Failed to fetch price data');
	}
};
