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

export const KNOWN_DESIGN_SYSTEMS: KnownDesignSystem[] = [
  {
    name: 'Atlaskit',
    organization: 'Atlassian',
    storybookUrl: 'https://atlassian.design/storybook',
    description: 'Atlassian Design System — UI components for Jira, Confluence, Trello',
    npmPackage: '@atlaskit/button',
    framework: ['react'],
    tags: ['enterprise', 'productivity'],
  },
  {
    name: 'Carbon Design System',
    organization: 'IBM',
    storybookUrl: 'https://react.carbondesignsystem.com',
    description: 'IBM Carbon Design System — enterprise-grade, open source design system',
    npmPackage: '@carbon/react',
    framework: ['react'],
    tags: ['enterprise', 'accessibility', 'open-source'],
  },
  {
    name: 'Primer',
    organization: 'GitHub',
    storybookUrl: 'https://primer.style/storybook',
    description: "GitHub's Primer Design System — components used across GitHub's products",
    npmPackage: '@primer/react',
    framework: ['react'],
    tags: ['developer-tools', 'open-source'],
  },
  {
    name: 'Polaris',
    organization: 'Shopify',
    storybookUrl: 'https://polaris.shopify.com/storybook',
    description: "Shopify's Polaris Design System — for building apps in the Shopify ecosystem",
    npmPackage: '@shopify/polaris',
    framework: ['react'],
    tags: ['ecommerce', 'merchant'],
  },
  {
    name: 'Fluent UI React',
    organization: 'Microsoft',
    storybookUrl: 'https://react.fluentui.dev',
    description: "Microsoft's Fluent UI Design System — for building Microsoft 365 experiences",
    npmPackage: '@fluentui/react-components',
    framework: ['react'],
    tags: ['enterprise', 'microsoft-365', 'office'],
  },
  {
    name: 'Spectrum',
    organization: 'Adobe',
    storybookUrl: 'https://react-spectrum.adobe.com/storybook',
    description: "Adobe's Spectrum Design System — adaptive, accessible, and robust components",
    npmPackage: '@adobe/react-spectrum',
    framework: ['react'],
    tags: ['creative', 'accessibility', 'adaptive'],
  },
  {
    name: 'Paste',
    organization: 'Twilio',
    storybookUrl: 'https://paste.twilio.design',
    description: "Twilio's Paste Design System — inclusive, accessible component library",
    npmPackage: '@twilio-paste/core',
    framework: ['react'],
    tags: ['communications', 'accessibility', 'inclusive'],
  },
  {
    name: 'Elastic UI (EUI)',
    organization: 'Elastic',
    storybookUrl: 'https://eui.elastic.co/storybook',
    description: "Elastic's EUI Design System — for Kibana and Elastic products",
    npmPackage: '@elastic/eui',
    framework: ['react'],
    tags: ['enterprise', 'search', 'analytics', 'observability'],
  },
  {
    name: 'Radix UI',
    organization: 'Radix',
    storybookUrl: 'https://storybook.radix-ui.com',
    description: 'Radix UI — headless, accessible component library optimized for fast development',
    npmPackage: '@radix-ui/react-button',
    framework: ['react'],
    tags: ['headless', 'accessibility', 'open-source', 'unstyled'],
  },
  {
    name: 'Chakra UI',
    organization: 'Chakra',
    storybookUrl: 'https://storybook.chakra-ui.com',
    description: 'Chakra UI — simple, modular and accessible component library for React',
    npmPackage: '@chakra-ui/react',
    framework: ['react'],
    tags: ['accessibility', 'open-source', 'simple'],
  },
  {
    name: 'Ant Design',
    organization: 'Ant Group',
    storybookUrl: 'https://ant.design/components/overview',
    description: 'Ant Design — enterprise-class UI design language and React component library',
    npmPackage: 'antd',
    framework: ['react'],
    tags: ['enterprise', 'china', 'alibaba'],
  },
  {
    name: 'Mantine',
    organization: 'Mantine',
    storybookUrl: 'https://ui.mantine.dev',
    description: 'Mantine UI — fully featured React components library with hooks',
    npmPackage: '@mantine/core',
    framework: ['react'],
    tags: ['open-source', 'hooks', 'theming'],
  },
  {
    name: 'Gestalt',
    organization: 'Pinterest',
    storybookUrl: 'https://gestalt.pinterest.systems/storybook',
    description: "Pinterest's Gestalt Design System — for building Pinterest product experiences",
    npmPackage: 'gestalt',
    framework: ['react'],
    tags: ['visual', 'media', 'content'],
  },
  {
    name: 'Orbit',
    organization: 'Kiwi.com',
    storybookUrl: 'https://orbit.kiwi/storybook',
    description: "Kiwi.com's Orbit Design System — for travel booking products",
    npmPackage: '@kiwicom/orbit-components',
    framework: ['react'],
    tags: ['travel', 'booking', 'open-source'],
  },
  {
    name: 'Vuetify',
    organization: 'Vuetify',
    storybookUrl: 'https://storybook.vuetifyjs.com',
    description: 'Vuetify — Material Design Component Framework for Vue.js',
    npmPackage: 'vuetify',
    framework: ['vue'],
    tags: ['material-design', 'vue', 'responsive'],
  },
  {
    name: 'PrimeVue',
    organization: 'PrimeTek',
    storybookUrl: 'https://primevue.org',
    description: 'PrimeVue — The Most Complete Vue UI Component Library',
    npmPackage: 'primevue',
    framework: ['vue'],
    tags: ['enterprise', 'vue', 'comprehensive'],
  },
  {
    name: 'Naive UI',
    organization: 'TuSimple',
    storybookUrl: 'https://www.naiveui.com',
    description: 'Naive UI — Fairly Complete Vue 3 Component Library with TypeScript support',
    npmPackage: 'naive-ui',
    framework: ['vue'],
    tags: ['vue', 'open-source', 'typescript'],
  },
  {
    name: 'Backstage UI',
    organization: 'Spotify',
    storybookUrl: 'https://backstage.io/storybook',
    description: "Spotify's Backstage platform UI components — open source developer portal components",
    npmPackage: '@backstage/core-components',
    framework: ['react'],
    tags: ['developer-tools', 'platform', 'open-source', 'spotify'],
  },
  {
    name: 'Lightning Design System',
    organization: 'Salesforce',
    storybookUrl: 'https://www.lightningdesignsystem.com',
    description: "Salesforce's Lightning Design System — for Salesforce app development",
    npmPackage: '@salesforce/design-system-react',
    framework: ['react'],
    tags: ['enterprise', 'crm', 'salesforce'],
  },
  {
    name: 'Pharos',
    organization: 'JSTOR',
    storybookUrl: 'https://pharos.jstor.org/storybook',
    description: "JSTOR's Pharos Design System — for academic digital content",
    npmPackage: '@ithaka/pharos',
    framework: ['react', 'web-components'],
    tags: ['academic', 'education', 'accessibility'],
  },
];

/** Search design systems by org name, system name, tag, or framework */
export function searchDesignSystems(query: string): KnownDesignSystem[] {
  const q = query.toLowerCase().trim();
  if (!q) return KNOWN_DESIGN_SYSTEMS;

  return KNOWN_DESIGN_SYSTEMS.filter(ds =>
    ds.name.toLowerCase().includes(q) ||
    ds.organization.toLowerCase().includes(q) ||
    ds.description.toLowerCase().includes(q) ||
    ds.tags?.some(t => t.includes(q)) ||
    ds.framework?.some(f => f.includes(q))
  );
}

/** Find exact design system by organization name */
export function findDesignSystemByOrg(orgName: string): KnownDesignSystem | undefined {
  const q = orgName.toLowerCase().trim();
  return KNOWN_DESIGN_SYSTEMS.find(
    ds =>
      ds.organization.toLowerCase() === q ||
      ds.organization.toLowerCase().includes(q) ||
      ds.name.toLowerCase() === q ||
      ds.name.toLowerCase().includes(q)
  );
}
