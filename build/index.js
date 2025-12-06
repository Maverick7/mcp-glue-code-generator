#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGenerateUiSchemaTool } from './tools/generateUiSchema.js';
// Check if we should run in HTTP mode (for testing) or stdio mode (for npx/VS Code)
const useHttp = process.argv.includes('--http') || process.env.MCP_HTTP === 'true';
if (useHttp) {
    // HTTP mode for testing with MCP Inspector
    import('./httpServer.js');
}
else {
    // Stdio mode for npx and VS Code integration
    async function main() {
        const server = new McpServer({
            name: 'glue-code-generator',
            version: '1.0.3',
        });
        // Register our core tool
        registerGenerateUiSchemaTool(server);
        // Create stdio transport
        const transport = new StdioServerTransport();
        // Connect server to transport
        await server.connect(transport);
        // Log to stderr (so it doesn't interfere with stdio protocol)
        console.error('🚀 MCP Glue Code Generator started (stdio mode)');
    }
    main().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map