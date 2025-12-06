/**
 * Schema Generator Utilities
 * Analyzes API JSON and Vue components to generate Zod schemas
 */
export interface FieldAnalysis {
    name: string;
    type: string;
    semanticType: string;
    sampleValue: unknown;
}
export interface ApiAnalysis {
    fields: FieldAnalysis[];
    isArray: boolean;
}
export interface ComponentAnalysis {
    name: string;
    props: string[];
    framework?: 'vue' | 'react';
}
/**
 * Analyze API JSON to extract field information
 */
export declare function analyzeApiJson(data: unknown): ApiAnalysis;
/**
 * Analyze component code (Vue or React) to extract props
 * Auto-detects framework based on code patterns
 */
export declare function analyzeVueComponent(code: string): ComponentAnalysis;
/**
 * Generate Zod schema code from analyses
 */
export declare function generateZodSchema(apiAnalysis: ApiAnalysis, componentAnalysis: ComponentAnalysis): string;
//# sourceMappingURL=schemaGenerator.d.ts.map