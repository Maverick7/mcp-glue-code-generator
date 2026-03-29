#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { registerGenerateUiSchemaTool } from './tools/generateUiSchema.js';
import { registerDesignSystemTools } from './tools/designSystemTools.js';
import { fetchStorybookData } from './storybook/fetcher.js';
import { findDesignSystemByOrg, KNOWN_DESIGN_SYSTEMS, } from './registry/knownDesignSystems.js';
import { generateMcpServer } from './generators/mcpServerGenerator.js';
const args = process.argv.slice(2);
// ─── CLI Mode ─────────────────────────────────────────────────────────────────
// Usage:
//   npx mcp-glue-code-generator --storybook <url> [--output <dir>] [--org <name>]
//   npx mcp-glue-code-generator --org <name> [--output <dir>]
//   npx mcp-glue-code-generator --list-orgs
//   npx mcp-glue-code-generator --http   (HTTP testing server)
const isCliMode = args.includes('--storybook') ||
    args.includes('--org') ||
    args.includes('--list-orgs');
if (args.includes('--list-orgs')) {
    // List all known design systems and exit
    console.log('\nKnown Design Systems\n' + '─'.repeat(60));
    for (const ds of KNOWN_DESIGN_SYSTEMS) {
        const fw = ds.framework?.join('/') ?? 'any';
        console.log(`\n  ${ds.organization} — ${ds.name}`);
        console.log(`  Framework : ${fw}`);
        console.log(`  Storybook : ${ds.storybookUrl}`);
        if (ds.npmPackage)
            console.log(`  Package   : ${ds.npmPackage}`);
    }
    console.log(`\nTotal: ${KNOWN_DESIGN_SYSTEMS.length} design systems\n`);
    console.log('Usage: npx mcp-glue-code-generator --org <name> --output <dir>');
    process.exit(0);
}
if (isCliMode) {
    runCli().catch(e => {
        console.error('\n❌ Error:', e instanceof Error ? e.message : e);
        process.exit(1);
    });
}
else if (args.includes('--http')) {
    // HTTP mode for testing with MCP Inspector
    import('./httpServer.js');
}
else {
    // Default: MCP stdio server
    startMcpServer().catch(() => process.exit(1));
}
// ─── CLI runner ───────────────────────────────────────────────────────────────
async function runCli() {
    const getArg = (flag) => {
        const idx = args.indexOf(flag);
        return idx !== -1 ? args[idx + 1] : undefined;
    };
    let storybookUrl = getArg('--storybook');
    const orgArg = getArg('--org');
    const outputPath = getArg('--output');
    const orgNameOverride = getArg('--name');
    const noPreview = args.includes('--no-preview');
    // Resolve Storybook URL from org name if not directly provided
    if (!storybookUrl && orgArg) {
        const known = findDesignSystemByOrg(orgArg);
        if (!known) {
            console.error(`\n❌ Unknown org: "${orgArg}"`);
            console.error('Run --list-orgs to see all known design systems.');
            console.error('Or provide a direct URL with --storybook <url>');
            process.exit(1);
        }
        storybookUrl = known.storybookUrl;
        console.log(`\n✓ Found: ${known.organization} — ${known.name}`);
        console.log(`  Using Storybook: ${storybookUrl}`);
    }
    if (!storybookUrl) {
        console.log('\nMCP Glue Code Generator — Design System MCP Builder');
        console.log('─'.repeat(50));
        console.log('\nUsage:');
        console.log('  npx mcp-glue-code-generator --storybook <url> [--output <dir>]');
        console.log('  npx mcp-glue-code-generator --org <name> [--output <dir>]');
        console.log('  npx mcp-glue-code-generator --list-orgs');
        console.log('\nExamples:');
        console.log('  npx mcp-glue-code-generator --org github --output ./github-mcp');
        console.log('  npx mcp-glue-code-generator --org shopify --output ./shopify-mcp');
        console.log('  npx mcp-glue-code-generator --storybook https://react.carbondesignsystem.com --output ./ibm-mcp');
        console.log('\nOr run as an MCP server (default):');
        console.log('  npx mcp-glue-code-generator\n');
        process.exit(0);
    }
    console.log(`\n🔍 Fetching design system from: ${storybookUrl}`);
    const ds = await fetchStorybookData(storybookUrl);
    if (orgNameOverride)
        ds.organizationName = orgNameOverride;
    else if (orgArg) {
        const known = findDesignSystemByOrg(orgArg);
        if (known)
            ds.organizationName = known.organization;
    }
    console.log(`✓ Discovered: ${ds.organizationName}`);
    console.log(`  Components : ${ds.totalComponents}`);
    console.log(`  Stories    : ${ds.totalStories}`);
    console.log(`  Categories : ${ds.categories.join(', ')}`);
    const { serverCode, packageJson, tsconfigJson, readmeContent } = generateMcpServer(ds, {
        includePreviewTool: !noPreview,
    });
    const outputDir = outputPath
        ? resolve(outputPath)
        : resolve(`./${ds.organizationName.toLowerCase().replace(/\s+/g, '-')}-design-mcp`);
    console.log(`\n📦 Generating MCP server to: ${outputDir}`);
    mkdirSync(`${outputDir}/src`, { recursive: true });
    writeFileSync(`${outputDir}/src/index.ts`, serverCode, 'utf-8');
    writeFileSync(`${outputDir}/package.json`, packageJson, 'utf-8');
    writeFileSync(`${outputDir}/tsconfig.json`, tsconfigJson, 'utf-8');
    writeFileSync(`${outputDir}/README.md`, readmeContent, 'utf-8');
    const serverSlug = ds.organizationName.toLowerCase().replace(/\s+/g, '-');
    console.log('\n✅ Done! Files created:');
    console.log(`  ${outputDir}/src/index.ts`);
    console.log(`  ${outputDir}/package.json`);
    console.log(`  ${outputDir}/tsconfig.json`);
    console.log(`  ${outputDir}/README.md`);
    console.log('\n🚀 Next steps:');
    console.log(`  cd ${outputDir}`);
    console.log('  npm install');
    console.log('  npm run build');
    console.log('\n🔌 Add to Claude Desktop (claude_desktop_config.json):');
    console.log('  {');
    console.log('    "mcpServers": {');
    console.log(`      "${serverSlug}-design-system": {`);
    console.log('        "command": "node",');
    console.log(`        "args": ["${outputDir}/build/index.js"]`);
    console.log('      }');
    console.log('    }');
    console.log('  }\n');
}
// ─── MCP Server ───────────────────────────────────────────────────────────────
async function startMcpServer() {
    const server = new McpServer({
        name: 'glue-code-generator',
        version: '2.0.0',
    });
    // Original tool: map API JSON to Vue/React component props
    registerGenerateUiSchemaTool(server);
    // New tools: discover, browse, preview, and generate MCP servers for any design system
    registerDesignSystemTools(server);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
//# sourceMappingURL=index.js.map