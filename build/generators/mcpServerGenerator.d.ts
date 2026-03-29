/**
 * MCP Server Generator
 * Generates a complete, standalone MCP server package for any discovered design system.
 * The generated server embeds all component data and provides rich tools for AI agents.
 */
import type { DiscoveredDesignSystem } from '../storybook/types.js';
interface GeneratorOptions {
    includePreviewTool?: boolean;
}
export interface GeneratedServer {
    serverCode: string;
    packageJson: string;
    tsconfigJson: string;
    readmeContent: string;
}
export declare function generateMcpServer(ds: DiscoveredDesignSystem, opts?: GeneratorOptions): GeneratedServer;
export {};
//# sourceMappingURL=mcpServerGenerator.d.ts.map