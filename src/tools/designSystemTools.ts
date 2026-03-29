/**
 * Design System MCP Tools
 *
 * Four new tools that let AI agents explore any organization's design system,
 * browse components, show live Storybook previews, and generate a complete
 * standalone MCP server for any org.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createUIResource } from '@mcp-ui/server';
import { z } from 'zod';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

import { fetchStorybookData } from '../storybook/fetcher.js';
import {
  searchDesignSystems,
  findDesignSystemByOrg,
  KNOWN_DESIGN_SYSTEMS,
} from '../registry/knownDesignSystems.js';
import { generateMcpServer } from '../generators/mcpServerGenerator.js';
import type { DiscoveredDesignSystem } from '../storybook/types.js';

// Session-scoped cache so repeated calls don't re-fetch
const cache = new Map<string, DiscoveredDesignSystem>();

async function getDesignSystem(url: string): Promise<DiscoveredDesignSystem> {
  const key = url.replace(/\/$/, '');
  if (!cache.has(key)) {
    cache.set(key, await fetchStorybookData(url));
  }
  return cache.get(key)!;
}

function escapeHtml(text: string): string {
  const e: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, c => e[c] ?? c);
}

export function registerDesignSystemTools(server: McpServer): void {
  // ─────────────────────────────────────────────────────────────────────────
  // Tool 1: discover_design_system
  // ─────────────────────────────────────────────────────────────────────────
  server.tool(
    'discover_design_system',
    'Discover and explore any organization\'s design system. Accepts a Storybook URL or an organization name (e.g. "Shopify", "IBM", "GitHub"). Lists all components, categories, and available stories.',
    {
      url_or_org_name: z.string().describe(
        'A Storybook URL (e.g. "https://react.carbondesignsystem.com") or an org/system name (e.g. "IBM", "Shopify", "GitHub", "Atlassian", "Adobe", "Microsoft")'
      ),
    },
    async ({ url_or_org_name }) => {
      try {
        const isUrl = url_or_org_name.startsWith('http://') || url_or_org_name.startsWith('https://');

        if (!isUrl) {
          // Org name lookup
          const known = findDesignSystemByOrg(url_or_org_name);

          if (!known) {
            const matches = searchDesignSystems(url_or_org_name);
            if (matches.length > 0) {
              const list = matches
                .map(m => `- **${m.organization}** — ${m.name}\n  URL: \`${m.storybookUrl}\`\n  ${m.description}`)
                .join('\n\n');
              return {
                content: [{
                  type: 'text' as const,
                  text: `## Design Systems matching "${url_or_org_name}"\n\n${list}\n\nRe-run with one of these URLs to explore components.`,
                }],
              };
            }

            const allList = KNOWN_DESIGN_SYSTEMS
              .map(m => `- **${m.organization}** (${m.name}) — \`${m.storybookUrl}\``)
              .join('\n');
            return {
              content: [{
                type: 'text' as const,
                text: `No design system found for "${url_or_org_name}".\n\n## All Known Design Systems\n\n${allList}\n\nOr provide a direct Storybook URL.`,
              }],
            };
          }

          // Found a known system — fetch it
          const ds = await getDesignSystem(known.storybookUrl);

          return {
            content: [{
              type: 'text' as const,
              text: formatDiscoveryResult(ds, {
                npmPackage: known.npmPackage,
                framework: known.framework?.join(', '),
                description: known.description,
              }),
            }],
          };
        }

        // Direct URL provided
        const ds = await getDesignSystem(url_or_org_name);
        const knownMatch = KNOWN_DESIGN_SYSTEMS.find(k =>
          k.storybookUrl.includes(new URL(ds.url).hostname)
        );

        return {
          content: [{
            type: 'text' as const,
            text: formatDiscoveryResult(ds, {
              npmPackage: knownMatch?.npmPackage,
              framework: knownMatch?.framework?.join(', '),
              description: knownMatch?.description,
            }),
          }],
        };

      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Tool 2: list_design_system_components
  // ─────────────────────────────────────────────────────────────────────────
  server.tool(
    'list_design_system_components',
    'List and search components from any design system Storybook. Filter by category, search by name, or browse all.',
    {
      storybook_url: z.string().describe('The Storybook base URL'),
      category: z.string().optional().describe('Filter by category (e.g. "Components", "Layout", "Form")'),
      search: z.string().optional().describe('Search by component name or tag'),
      limit: z.number().min(1).max(100).optional().describe('Max results (default 30)'),
    },
    async ({ storybook_url, category, search, limit = 30 }) => {
      try {
        const ds = await getDesignSystem(storybook_url);
        let components = ds.components;

        if (category) {
          components = components.filter(c =>
            c.category.toLowerCase().includes(category.toLowerCase())
          );
        }

        if (search) {
          const q = search.toLowerCase();
          components = components.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.fullTitle.toLowerCase().includes(q) ||
            c.tags?.some(t => t.toLowerCase().includes(q))
          );
        }

        const shown = components.slice(0, limit);

        const blocks = shown.map(c => {
          const firstStory = c.stories[0];
          const storyList = c.stories.map(s => s.name).join(', ');
          const tags = c.tags?.length ? `\n  Tags: ${c.tags.join(', ')}` : '';
          return `### ${c.name}\n- **Category**: ${c.category}\n- **Stories (${c.stories.length})**: ${storyList}${tags}\n- **Preview**: story ID \`${firstStory?.id ?? 'N/A'}\``;
        });

        const header = [
          `# ${ds.organizationName} Components`,
          `Showing **${shown.length}** of **${components.length}** components${category ? ` in "${category}"` : ''}${search ? ` matching "${search}"` : ''}`,
          `Total: ${ds.totalComponents} components · ${ds.totalStories} stories · ${ds.categories.length} categories`,
        ].join('\n');

        const catList = `\n\n**Available categories**: ${ds.categories.join(', ')}`;

        return {
          content: [{
            type: 'text' as const,
            text: header + '\n\n' + blocks.join('\n\n') +
              (components.length > shown.length
                ? `\n\n_...and ${components.length - shown.length} more. Increase limit or filter by category._`
                : '') +
              catList,
          }],
        };

      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Tool 3: preview_design_system_component
  // ─────────────────────────────────────────────────────────────────────────
  server.tool(
    'preview_design_system_component',
    'Render a live preview of any design system component story directly in the chat using the Storybook iframe embed.',
    {
      storybook_url: z.string().describe('The Storybook base URL'),
      story_id: z.string().describe('The story ID to preview (e.g. "button--primary", "components-button--large")'),
      show_code: z.boolean().optional().describe('Include a usage code snippet (default true)'),
    },
    async ({ storybook_url, story_id, show_code = true }) => {
      try {
        const baseUrl = storybook_url.replace(/\/$/, '');
        const ds = await getDesignSystem(baseUrl);

        const component = ds.components.find(c => c.stories.some(s => s.id === story_id));
        const story = component?.stories.find(s => s.id === story_id);

        const iframeUrl = `${baseUrl}/iframe.html?id=${encodeURIComponent(story_id)}&viewMode=story`;
        const fullStoryUrl = `${baseUrl}/?path=/story/${story_id}`;

        const knownPkg = KNOWN_DESIGN_SYSTEMS.find(k => {
          try {
            return k.storybookUrl.includes(new URL(baseUrl).hostname);
          } catch { return false; }
        });

        const html = buildPreviewHtml({
          iframeUrl,
          fullStoryUrl,
          componentName: component?.name ?? story_id,
          storyName: story?.name ?? '',
          organizationName: ds.organizationName,
        });

        const uiPreview = await createUIResource({
          uri: `ui://design-system/${ds.organizationName.toLowerCase().replace(/\s+/g, '-')}/preview-${Date.now()}`,
          content: { type: 'rawHtml', htmlString: html },
          encoding: 'text',
        });

        let codeBlock = '';
        if (show_code && component) {
          const pkgName = knownPkg?.npmPackage ?? `@${ds.organizationName.toLowerCase()}/components`;
          codeBlock = `\n\n## Usage\n\`\`\`tsx\nimport { ${component.name} } from '${pkgName}';\n\n// ${story?.name ?? 'Default'} variant\n<${component.name} />\n\`\`\`\n\nFull story: ${fullStoryUrl}`;
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `## ${component?.name ?? story_id}${story ? ` — ${story.name}` : ''}${codeBlock}`,
            },
            { type: 'resource' as const, resource: uiPreview.resource },
          ],
        };

      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Tool 4: generate_design_system_mcp
  // ─────────────────────────────────────────────────────────────────────────
  server.tool(
    'generate_design_system_mcp',
    'Generate a complete, standalone MCP server customized for any organization\'s design system. The generated server can be added to Claude Desktop, VS Code Copilot, or any MCP-compatible chatbot or agent.',
    {
      storybook_url: z.string().describe('The Storybook URL to generate the MCP server for'),
      org_name: z.string().optional().describe('Override the organization name (auto-detected from URL if omitted)'),
      output_path: z.string().optional().describe('Directory to save the generated server (e.g. "./spotify-design-mcp"). Prints code if omitted.'),
      include_preview: z.boolean().optional().describe('Include live component preview tool in the generated server (default true)'),
    },
    async ({ storybook_url, org_name, output_path, include_preview = true }) => {
      try {
        const ds = await getDesignSystem(storybook_url);
        if (org_name) ds.organizationName = org_name;

        const { serverCode, packageJson, tsconfigJson, readmeContent } = generateMcpServer(ds, {
          includePreviewTool: include_preview,
        });

        if (output_path) {
          const dir = resolve(output_path);
          mkdirSync(`${dir}/src`, { recursive: true });
          writeFileSync(`${dir}/src/index.ts`, serverCode, 'utf-8');
          writeFileSync(`${dir}/package.json`, packageJson, 'utf-8');
          writeFileSync(`${dir}/tsconfig.json`, tsconfigJson, 'utf-8');
          writeFileSync(`${dir}/README.md`, readmeContent, 'utf-8');

          const serverSlug = ds.organizationName.toLowerCase().replace(/\s+/g, '-');

          return {
            content: [{
              type: 'text' as const,
              text: [
                `# ✅ Generated ${ds.organizationName} Design System MCP`,
                ``,
                `**Location**: \`${dir}\``,
                `**Components**: ${ds.totalComponents} components across ${ds.categories.length} categories`,
                `**Stories**: ${ds.totalStories} variants`,
                ``,
                `## Files Created`,
                `- \`src/index.ts\` — MCP server with all ${ds.totalComponents} components embedded`,
                `- \`package.json\` — Dependencies`,
                `- \`tsconfig.json\` — TypeScript config`,
                `- \`README.md\` — Integration guide`,
                ``,
                `## Quick Start`,
                `\`\`\`bash`,
                `cd ${dir}`,
                `npm install`,
                `npm run build`,
                `\`\`\``,
                ``,
                `## Add to Claude Desktop`,
                `Add to \`~/Library/Application Support/Claude/claude_desktop_config.json\`:`,
                `\`\`\`json`,
                `{`,
                `  "mcpServers": {`,
                `    "${serverSlug}-design-system": {`,
                `      "command": "node",`,
                `      "args": ["${dir}/build/index.js"]`,
                `    }`,
                `  }`,
                `}`,
                `\`\`\``,
                ``,
                `## Generated Tools`,
                `- \`list_components\` — Browse all ${ds.totalComponents} components`,
                `- \`search_components\` — Full-text search`,
                `- \`get_component\` — Details and story links`,
                `- \`suggest_component\` — AI-powered recommendations`,
                include_preview ? `- \`preview_component\` — Live Storybook iframe preview` : '',
              ].filter(l => l !== null).join('\n'),
            }],
          };
        }

        // No output path — return code inline
        return {
          content: [{
            type: 'text' as const,
            text: [
              `# Generated MCP Server: ${ds.organizationName} Design System`,
              ``,
              `**${ds.totalComponents} components** · **${ds.totalStories} stories** · **${ds.categories.length} categories**`,
              ``,
              `## src/index.ts`,
              `\`\`\`typescript`,
              serverCode,
              `\`\`\``,
              ``,
              `## package.json`,
              `\`\`\`json`,
              packageJson,
              `\`\`\``,
              ``,
              `Save to a directory and run \`npm install && npm run build\` to get started.`,
            ].join('\n'),
          }],
        };

      } catch (e) {
        return errorResult(e);
      }
    }
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDiscoveryResult(
  ds: DiscoveredDesignSystem,
  extra: { npmPackage?: string; framework?: string; description?: string }
): string {
  const catBreakdown = ds.categories
    .map(cat => {
      const n = ds.components.filter(c => c.category === cat).length;
      return `  - **${cat}** — ${n} component${n !== 1 ? 's' : ''}`;
    })
    .join('\n');

  const topComponents = ds.components
    .slice(0, 12)
    .map(c => `  - \`${c.name}\` (${c.stories.length} stories)`)
    .join('\n');

  const extraInfo = [
    extra.description ? `**About**: ${extra.description}` : '',
    extra.npmPackage ? `**npm package**: \`${extra.npmPackage}\`` : '',
    extra.framework ? `**Framework**: ${extra.framework}` : '',
  ].filter(Boolean).join('\n');

  return [
    `# ${ds.organizationName} Design System`,
    ``,
    `**Storybook**: ${ds.url}`,
    `**Storybook version**: v${ds.storybookVersion}`,
    `**Components**: ${ds.totalComponents}`,
    `**Stories**: ${ds.totalStories}`,
    `**Categories**: ${ds.categories.length}`,
    extraInfo,
    ``,
    `## Categories`,
    catBreakdown,
    ``,
    `## Sample Components`,
    topComponents,
    ds.components.length > 12 ? `  - ...and ${ds.components.length - 12} more` : '',
    ``,
    `## Next Steps`,
    `- Use \`list_design_system_components\` to browse all components`,
    `- Use \`preview_design_system_component\` with a story ID for a live preview`,
    `- Use \`generate_design_system_mcp\` to generate a custom standalone MCP server`,
  ].filter(l => l !== null).join('\n');
}

function buildPreviewHtml(opts: {
  iframeUrl: string;
  fullStoryUrl: string;
  componentName: string;
  storyName: string;
  organizationName: string;
}): string {
  const { iframeUrl, fullStoryUrl, componentName, storyName, organizationName } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;height:100vh;display:flex;flex-direction:column}
    .bar{background:#1a1a2e;color:#fff;padding:8px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:40px}
    .bar-left{display:flex;align-items:center;gap:10px;overflow:hidden}
    .org{background:rgba(255,255,255,.15);padding:2px 10px;border-radius:10px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
    .comp{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .story{opacity:.55;font-size:12px;white-space:nowrap}
    .link{color:rgba(255,255,255,.65);font-size:11px;text-decoration:none;padding:3px 8px;border:1px solid rgba(255,255,255,.2);border-radius:3px;white-space:nowrap;flex-shrink:0}
    .link:hover{background:rgba(255,255,255,.1)}
    iframe{flex:1;border:none;width:100%;background:#fff}
    .foot{background:#1a1a2e;color:rgba(255,255,255,.3);text-align:center;font-size:9px;padding:5px;text-transform:uppercase;letter-spacing:.1em}
  </style>
</head>
<body>
  <div class="bar">
    <div class="bar-left">
      <span class="org">${escapeHtml(organizationName)}</span>
      <span class="comp">${escapeHtml(componentName)}</span>
      ${storyName ? `<span class="story">/ ${escapeHtml(storyName)}</span>` : ''}
    </div>
    <a href="${escapeHtml(fullStoryUrl)}" target="_blank" class="link">Open in Storybook ↗</a>
  </div>
  <iframe
    src="${escapeHtml(iframeUrl)}"
    title="${escapeHtml(componentName)}"
    sandbox="allow-scripts allow-same-origin"
    loading="lazy"
  ></iframe>
  <div class="foot">MCP Glue Code Generator · Design System Preview</div>
</body>
</html>`;
}

function errorResult(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return {
    content: [{ type: 'text' as const, text: `❌ Error: ${msg}` }],
    isError: true,
  };
}
