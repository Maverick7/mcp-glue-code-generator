#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import { registerGenerateUiSchemaTool } from './tools/generateUiSchema.js';
const app = express();
const port = process.env.PORT || 3000;
// CORS configuration for VS Code and MCP clients
app.use(cors({
    origin: '*',
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));
app.use(express.json());
// Map to store transports by session ID
const transports = {};
// Health check endpoint
app.get('/', (_req, res) => {
    res.json({
        name: 'MCP UI Glue Code Generator',
        version: '1.0.0',
        description: 'Maps messy API JSON to Vue Design System components using Zod schemas',
        mcp_endpoint: '/mcp'
    });
});
// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    let transport;
    if (sessionId && transports[sessionId]) {
        // Session exists - reuse transport
        transport = transports[sessionId];
    }
    else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request - create new transport
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sid) => {
                transports[sid] = transport;
                console.log(`✅ MCP Session initialized: ${sid}`);
            },
        });
        // Clean up on session close
        transport.onclose = () => {
            if (transport.sessionId) {
                console.log(`👋 MCP Session closed: ${transport.sessionId}`);
                delete transports[transport.sessionId];
            }
        };
        // Create new server instance for this session
        const server = new McpServer({
            name: 'glue-code-generator',
            version: '1.0.0',
        });
        // Register our core tool
        registerGenerateUiSchemaTool(server);
        // Connect server to transport
        await server.connect(transport);
    }
    else {
        return res.status(400).json({
            error: { message: 'Bad Request: No valid session ID provided' },
        });
    }
    // Handle the request
    await transport.handleRequest(req, res, req.body);
});
// Handler for GET and DELETE requests
const handleSessionRequest = async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        return res.status(404).send('Session not found');
    }
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
};
// GET handles server-to-client streaming
app.get('/mcp', handleSessionRequest);
// DELETE handles session termination
app.delete('/mcp', handleSessionRequest);
// Start server
app.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     🚀 MCP UI Glue Code Generator Server                     ║
╠══════════════════════════════════════════════════════════════╣
║  Server:    http://localhost:${port}                            ║
║  MCP:       http://localhost:${port}/mcp                        ║
║                                                              ║
║  Tools:                                                      ║
║    • generate_ui_schema - Map API JSON to Vue components     ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
//# sourceMappingURL=index.js.map