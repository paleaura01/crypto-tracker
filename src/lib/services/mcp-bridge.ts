/* eslint-disable no-console */
/**
 * Browser-compatible bridge for MCP wallet operations
 * Provides direct database access via MCP server from the frontend
 */

export interface MCPResponse {
    success: boolean;
    data?: unknown[];
    error?: string;
}

interface MCPExecutor {
    mcpExecuteSQL: (query: string) => Promise<unknown[]>;
}

class MCPBridge {
    private static instance: MCPBridge;
    private projectId = 'usmcnnvgdntpxjhhhplt';

    static getInstance(): MCPBridge {
        if (!MCPBridge.instance) {
            MCPBridge.instance = new MCPBridge();
        }
        return MCPBridge.instance;
    }    /**
     * Execute SQL query via MCP server
     */
    async executeSQL(query: string): Promise<unknown[]> {
        try {
            // In a browser environment, we need to make this call to the MCP server
            // This is a simplified implementation - in practice, you'd have a proper MCP client
            const response = await fetch('/api/mcp/execute-sql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: this.projectId,
                    query: query
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'MCP query failed');
            }

            return result.data || [];
        } catch (error) {
            console.error('MCP Bridge SQL execution failed:', error);
            throw error;
        }
    }

    /**
     * Apply a migration via MCP server
     */
    async applyMigration(name: string, query: string): Promise<boolean> {
        try {
            const response = await fetch('/api/mcp/apply-migration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: this.projectId,
                    name: name,
                    query: query
                })
            });

            const result = await response.json();
            return response.ok && result.success;
        } catch (error) {
            console.error('MCP Bridge migration failed:', error);
            return false;
        }
    }

    /**
     * Test connection to MCP server
     */
    async testConnection(): Promise<boolean> {
        try {
            const result = await this.executeSQL('SELECT 1 as test;');
            return result && result.length > 0;
        } catch (error) {
            console.error('MCP Bridge connection test failed:', error);
            return false;
        }
    }
}

// Make MCP bridge available globally for the wallet service
if (typeof window !== 'undefined') {
    const mcpBridge = MCPBridge.getInstance();
    (window as unknown as MCPExecutor).mcpExecuteSQL = (query: string) => mcpBridge.executeSQL(query);
}

export const mcpBridge = MCPBridge.getInstance();
