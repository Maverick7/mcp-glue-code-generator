/**
 * TypeScript types for Storybook metadata and discovered design systems
 */
export interface StorybookEntry {
    id: string;
    title: string;
    name: string;
    importPath?: string;
    type?: 'story' | 'docs';
    tags?: string[];
    parameters?: Record<string, unknown>;
}
export interface StorybookIndex {
    v: number;
    entries?: Record<string, StorybookEntry>;
    stories?: Record<string, StorybookEntry>;
}
export interface ComponentStory {
    id: string;
    name: string;
}
export interface DesignSystemComponent {
    id: string;
    name: string;
    category: string;
    fullTitle: string;
    stories: ComponentStory[];
    tags?: string[];
}
export interface DiscoveredDesignSystem {
    url: string;
    organizationName: string;
    components: DesignSystemComponent[];
    categories: string[];
    totalComponents: number;
    totalStories: number;
    fetchedAt: string;
    storybookVersion: number;
}
//# sourceMappingURL=types.d.ts.map