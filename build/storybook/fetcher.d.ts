/**
 * Storybook Fetcher
 * Fetches and parses Storybook metadata from any publicly accessible Storybook instance.
 * Supports Storybook v6 (stories.json) and v7/v8 (index.json).
 */
import type { DiscoveredDesignSystem } from './types.js';
export declare function fetchStorybookData(storybookUrl: string): Promise<DiscoveredDesignSystem>;
//# sourceMappingURL=fetcher.d.ts.map