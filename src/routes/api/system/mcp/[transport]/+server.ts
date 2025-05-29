import { createMcpHandler } from '@vercel/mcp-adapter';
import { z } from 'zod';

// In-memory storage for SSH connections (in production, use a database)
const sshConnections = new Map<string, {
	id: string;
	host: string;
	username: string;
	connected: boolean;
}>();

// Create the MCP handler with your custom tools
const handler = createMcpHandler(async (server) => {
	// SSH Connection Management Tools
	server.tool(
		'ssh_create_connection',
		'Create a new SSH connection',
		{
			connectionId: z.string().describe('Unique ID for the SSH connection'),
			host: z.string().describe('SSH host address'),
			username: z.string().describe('SSH username'),
			port: z.number().int().min(1).max(65535).default(22).describe('SSH port')
		},
		async ({ connectionId, host, username, port }) => {
			if (sshConnections.has(connectionId)) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ SSH connection '${connectionId}' already exists`
						}
					]
				};
			}

			sshConnections.set(connectionId, {
				id: connectionId,
				host,
				username,
				connected: false
			});

			return {
				content: [
					{
						type: 'text',
						text: `✅ SSH connection '${connectionId}' created for ${username}@${host}:${port}`
					}
				]
			};
		}
	);
	server.tool(
		'ssh_execute',
		'Execute a command on an SSH connection',
		{
			connectionId: z.string().describe('ID of the SSH connection to use (create one first with ssh_create_connection)'),
			command: z.string().describe('Command to execute')
		},
		async ({ connectionId, command }) => {
			const connection = sshConnections.get(connectionId);
			if (!connection) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ SSH connection '${connectionId}' not found. Available connections: ${Array.from(sshConnections.keys()).join(', ') || 'none'}`
						}
					]
				};
			}

			// In a real implementation, you would execute the command via SSH
			return {
				content: [
					{
						type: 'text',
						text: `🔧 Would execute command '${command}' on ${connection.host} (simulated for security)`
					}
				]
			};
		}
	);
	server.tool(
		'ssh_disconnect',
		'Disconnect an SSH connection',
		{
			connectionId: z.string().describe('ID of the SSH connection to disconnect')
		},
		async ({ connectionId }) => {
			const connection = sshConnections.get(connectionId);
			if (!connection) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ SSH connection '${connectionId}' not found. Available connections: ${Array.from(sshConnections.keys()).join(', ') || 'none'}`
						}
					]
				};
			}

			sshConnections.delete(connectionId);
			return {
				content: [
					{
						type: 'text',
						text: `✅ SSH connection '${connectionId}' disconnected and removed`
					}
				]
			};
		}
	);
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
						const marketData = data.map((coin: {
					name?: string;
					symbol?: string;
					current_price?: number;
					price_change_percentage_24h?: number;
				}) => 
					`${coin.name} (${coin.symbol?.toUpperCase()}): $${coin.current_price?.toLocaleString() || 'N/A'} (${coin.price_change_percentage_24h?.toFixed(2) || 'N/A'}%)`
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
