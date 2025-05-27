import { createMcpHandler } from '@vercel/mcp-adapter';
import { z } from 'zod';

// Create the MCP handler with your custom tools
const handler = createMcpHandler(async (server) => {
	// Crypto price tool
	server.tool(
		'get_crypto_price',
		'Get current price of a cryptocurrency',
		{
			symbol: z.string().describe('Cryptocurrency symbol (e.g., BTC, ETH)')
		},
		async ({ symbol }) => {
			try {
				// Use your existing crypto price logic or CoinGecko API
				const response = await fetch(
					`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`
				);
				const data = await response.json();
				const price = data[symbol.toLowerCase()]?.usd;
				
				if (price) {
					return {
						content: [
							{
								type: 'text',
								text: `💰 ${symbol.toUpperCase()}: $${price.toLocaleString()}`
							}
						]
					};
				} else {
					return {
						content: [
							{
								type: 'text',
								text: `❌ Could not find price for ${symbol}`
							}
						]
					};
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Error fetching price: ${error instanceof Error ? error.message : 'Unknown error'}`
						}
					]
				};
			}
		}
	);

	// Portfolio analysis tool
	server.tool(
		'analyze_portfolio',
		'Analyze cryptocurrency portfolio performance',
		{
			wallet_address: z.string().describe('Wallet address to analyze')
		},
		async ({ wallet_address }) => {
			try {
				// This would integrate with your existing portfolio logic
				return {
					content: [
						{
							type: 'text',
							text: `📊 Portfolio analysis for ${wallet_address} would go here. You can integrate this with your existing portfolio logic.`
						}
					]
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Error analyzing portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`
						}
					]
				};
			}
		}
	);

	// Market data tool
	server.tool(
		'get_market_data',
		'Get market overview and trending cryptocurrencies',
		{
			limit: z.number().int().min(1).max(50).default(10).describe('Number of top cryptocurrencies to return')
		},
		async ({ limit }) => {
			try {
				const response = await fetch(
					`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1`
				);
				const data = await response.json();
				
				const marketData = data.map((coin: any) => 
					`${coin.name} (${coin.symbol.toUpperCase()}): $${coin.current_price?.toLocaleString() || 'N/A'} (${coin.price_change_percentage_24h?.toFixed(2) || 'N/A'}%)`
				).join('\n');
				
				return {
					content: [
						{
							type: 'text',
							text: `📈 Top ${limit} Cryptocurrencies by Market Cap:\n\n${marketData}`
						}
					]
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Error fetching market data: ${error instanceof Error ? error.message : 'Unknown error'}`
						}
					]
				};
			}
		}
	);
});

// Export the handler for all HTTP methods that MCP uses
export const GET = handler;
export const POST = handler;
export const DELETE = handler;
