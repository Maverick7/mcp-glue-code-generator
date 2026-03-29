/**
 * Registry of well-known public design systems with their Storybook URLs.
 * Allows users to reference orgs by name instead of URL.
 */
export interface KnownDesignSystem {
    name: string;
    organization: string;
    storybookUrl: string;
    description: string;
    npmPackage?: string;
    framework?: string[];
    tags?: string[];
}
export declare const KNOWN_DESIGN_SYSTEMS: KnownDesignSystem[];
/** Search design systems by org name, system name, tag, or framework */
export declare function searchDesignSystems(query: string): KnownDesignSystem[];
/** Find exact design system by organization name */
export declare function findDesignSystemByOrg(orgName: string): KnownDesignSystem | undefined;
//# sourceMappingURL=knownDesignSystems.d.ts.map