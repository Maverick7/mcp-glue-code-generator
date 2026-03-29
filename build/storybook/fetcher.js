/**
 * Storybook Fetcher
 * Fetches and parses Storybook metadata from any publicly accessible Storybook instance.
 * Supports Storybook v6 (stories.json) and v7/v8 (index.json).
 */
export async function fetchStorybookData(storybookUrl) {
    const baseUrl = storybookUrl.replace(/\/$/, '').replace(/\/(index\.html)?$/, '');
    let indexData = null;
    const errors = [];
    // Try Storybook v7/v8 index.json first, then v6 stories.json
    for (const path of ['/index.json', '/stories.json']) {
        try {
            const res = await fetch(`${baseUrl}${path}`, {
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'mcp-glue-code-generator/2.0 (Design System MCP)',
                },
                signal: AbortSignal.timeout(15000),
            });
            if (res.ok) {
                const contentType = res.headers.get('content-type') ?? '';
                if (!contentType.includes('json') && !contentType.includes('text')) {
                    errors.push(`${path}: unexpected content-type ${contentType}`);
                    continue;
                }
                const data = (await res.json());
                if (data && (data.entries || data.stories)) {
                    indexData = data;
                    break;
                }
                else {
                    errors.push(`${path}: response missing entries/stories fields`);
                }
            }
            else {
                errors.push(`${path}: HTTP ${res.status} ${res.statusText}`);
            }
        }
        catch (e) {
            errors.push(`${path}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    if (!indexData) {
        throw new Error(`Cannot fetch Storybook data from "${storybookUrl}".\n` +
            `Tried /index.json and /stories.json — errors: ${errors.join(' | ')}\n\n` +
            `Troubleshooting:\n` +
            `• Verify the URL is correct and the Storybook is publicly accessible\n` +
            `• Try opening ${baseUrl}/index.json in a browser\n` +
            `• Some Storybooks require authentication or are behind a VPN`);
    }
    return parseStorybookIndex(indexData, baseUrl);
}
function parseStorybookIndex(index, baseUrl) {
    const entries = index.entries ?? index.stories ?? {};
    const componentMap = new Map();
    let totalStories = 0;
    for (const entry of Object.values(entries)) {
        // Skip docs-only entries (we want actual story entries)
        if (entry.type === 'docs')
            continue;
        totalStories++;
        const parts = entry.title.split('/');
        const componentName = parts[parts.length - 1].trim();
        const category = parts.length > 1
            ? parts.slice(0, -1).join('/').trim()
            : 'General';
        // Create a stable component ID from the title
        const componentId = entry.title
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-/]/g, '')
            .replace(/\//g, '--');
        if (!componentMap.has(componentId)) {
            componentMap.set(componentId, {
                id: componentId,
                name: componentName,
                category,
                fullTitle: entry.title,
                stories: [],
                tags: entry.tags?.filter(t => t !== 'autodocs' && t !== 'dev'),
            });
        }
        componentMap.get(componentId).stories.push({
            id: entry.id,
            name: entry.name,
        });
    }
    const components = Array.from(componentMap.values())
        .sort((a, b) => a.fullTitle.localeCompare(b.fullTitle));
    const categories = [...new Set(components.map(c => c.category))].sort();
    // Auto-detect organization name from URL
    let orgName = 'Unknown';
    try {
        const urlObj = new URL(baseUrl);
        const hostname = urlObj.hostname.replace(/^www\./, '');
        const subdomain = hostname.split('.')[0];
        // Use subdomain if it's meaningful, otherwise use domain root
        orgName = subdomain === 'storybook' || subdomain === 'design'
            ? hostname.split('.')[1] ?? subdomain
            : subdomain;
        orgName = orgName.charAt(0).toUpperCase() + orgName.slice(1);
    }
    catch { }
    return {
        url: baseUrl,
        organizationName: orgName,
        components,
        categories,
        totalComponents: components.length,
        totalStories,
        fetchedAt: new Date().toISOString(),
        storybookVersion: index.v,
    };
}
//# sourceMappingURL=fetcher.js.map