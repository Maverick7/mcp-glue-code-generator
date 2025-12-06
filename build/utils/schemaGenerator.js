/**
 * Schema Generator Utilities
 * Analyzes API JSON and Vue components to generate Zod schemas
 */
/**
 * Analyze API JSON to extract field information
 */
export function analyzeApiJson(data) {
    const isArray = Array.isArray(data);
    const sample = isArray ? data[0] : data;
    if (!sample || typeof sample !== 'object') {
        return { fields: [], isArray };
    }
    const fields = [];
    for (const [key, value] of Object.entries(sample)) {
        fields.push({
            name: key,
            type: detectType(value),
            semanticType: detectSemanticType(key, value),
            sampleValue: value,
        });
    }
    return { fields, isArray };
}
/**
 * Analyze component code (Vue or React) to extract props
 * Auto-detects framework based on code patterns
 */
export function analyzeVueComponent(code) {
    const props = [];
    let name = 'Component';
    const framework = detectFramework(code);
    if (framework === 'react') {
        return analyzeReactComponent(code);
    }
    // Vue component analysis
    // Extract component name
    const nameMatch = code.match(/name:\s*['"]([^'"]+)['"]/);
    if (nameMatch) {
        name = nameMatch[1];
    }
    // Extract props from Vue 3 defineProps
    const definePropsMatch = code.match(/defineProps<\{([^}]+)\}>/s);
    if (definePropsMatch) {
        const propsContent = definePropsMatch[1];
        const propMatches = propsContent.matchAll(/(\w+)\s*[?]?:/g);
        for (const match of propMatches) {
            props.push(match[1]);
        }
    }
    // Extract props from props object (Vue 2/3 options API)
    const propsObjectMatch = code.match(/props:\s*\{([^}]+)\}/s);
    if (propsObjectMatch) {
        const propsContent = propsObjectMatch[1];
        const propMatches = propsContent.matchAll(/(\w+)\s*:/g);
        for (const match of propMatches) {
            props.push(match[1]);
        }
    }
    // Extract props from template bindings if no explicit props
    if (props.length === 0) {
        const bindingMatches = code.matchAll(/:(\w+)=|v-bind:(\w+)=|\{\{\s*(\w+)\s*\}\}/g);
        for (const match of bindingMatches) {
            const prop = match[1] || match[2] || match[3];
            if (prop && !props.includes(prop)) {
                props.push(prop);
            }
        }
    }
    return { name, props, framework: 'vue' };
}
/**
 * Analyze React component to extract props
 */
function analyzeReactComponent(code) {
    const props = [];
    let name = 'Component';
    // Extract component name from function/const declaration
    const funcMatch = code.match(/(?:function|const)\s+(\w+)/);
    if (funcMatch) {
        name = funcMatch[1];
    }
    // Extract props from TypeScript interface/type
    const interfaceMatch = code.match(/interface\s+\w*Props\s*\{([^}]+)\}/s);
    if (interfaceMatch) {
        const propsContent = interfaceMatch[1];
        const propMatches = propsContent.matchAll(/(\w+)\s*[?]?:/g);
        for (const match of propMatches) {
            props.push(match[1]);
        }
    }
    // Extract props from type alias
    const typeMatch = code.match(/type\s+\w*Props\s*=\s*\{([^}]+)\}/s);
    if (typeMatch) {
        const propsContent = typeMatch[1];
        const propMatches = propsContent.matchAll(/(\w+)\s*[?]?:/g);
        for (const match of propMatches) {
            props.push(match[1]);
        }
    }
    // Extract from destructured props in function signature
    const destructureMatch = code.match(/\(\s*\{\s*([^}]+)\s*\}/);
    if (destructureMatch && props.length === 0) {
        const propsContent = destructureMatch[1];
        const propMatches = propsContent.matchAll(/(\w+)(?:\s*[=,:]|\s*$)/g);
        for (const match of propMatches) {
            if (match[1] && !props.includes(match[1])) {
                props.push(match[1]);
            }
        }
    }
    // Extract from JSX usage if no explicit props
    if (props.length === 0) {
        const jsxMatches = code.matchAll(/\{(\w+)\}|(\w+)=\{/g);
        for (const match of jsxMatches) {
            const prop = match[1] || match[2];
            if (prop && !props.includes(prop) && !['className', 'style', 'key', 'ref', 'children'].includes(prop)) {
                props.push(prop);
            }
        }
    }
    return { name, props, framework: 'react' };
}
/**
 * Detect framework from code patterns
 */
function detectFramework(code) {
    // Vue indicators
    const vuePatterns = [
        '<template>',
        'defineProps',
        'v-bind:',
        'v-if',
        'v-for',
        ':class=',
        '{{ ',
        '<script setup',
    ];
    // React indicators
    const reactPatterns = [
        'import React',
        'from "react"',
        "from 'react'",
        'useState',
        'useEffect',
        'className=',
        'jsx',
        'tsx',
        ': React.FC',
        'ReactNode',
    ];
    const vueScore = vuePatterns.filter(p => code.includes(p)).length;
    const reactScore = reactPatterns.filter(p => code.includes(p)).length;
    return reactScore > vueScore ? 'react' : 'vue';
}
/**
 * Generate Zod schema code from analyses
 */
export function generateZodSchema(apiAnalysis, componentAnalysis) {
    const mappings = [];
    const transformations = [];
    for (const field of apiAnalysis.fields) {
        const zodType = mapTypeToZod(field.type);
        mappings.push(`  ${field.name}: ${zodType},`);
        // Add transformation comments
        if (field.semanticType !== 'unknown') {
            transformations.push(`  // ${field.name} → ${field.semanticType}`);
        }
    }
    const schemaCode = `import { z } from 'zod';

// Raw API Response Schema
export const ApiResponseSchema = z.object({
${mappings.join('\n')}
});

// Type inference
export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// Field Mappings (API → Component Props)
// ${componentAnalysis.name}
${transformations.join('\n')}

// Transform function
export function transformToComponentProps(data: ApiResponse) {
  return {
${generateTransformBody(apiAnalysis)}
  };
}

// Validated transform
export function parseAndTransform(rawData: unknown) {
  const validated = ApiResponseSchema.parse(rawData);
  return transformToComponentProps(validated);
}`;
    return schemaCode;
}
// Helper: Detect JavaScript type
function detectType(value) {
    if (value === null)
        return 'null';
    if (Array.isArray(value))
        return 'array';
    return typeof value;
}
// Helper: Detect semantic type from field name and value
function detectSemanticType(name, value) {
    const nameLower = name.toLowerCase();
    // ID detection
    if (nameLower.includes('id') || nameLower.endsWith('_id') || nameLower.startsWith('id_')) {
        return 'id';
    }
    // Status detection
    if (nameLower.includes('status') || nameLower.includes('state') || nameLower.endsWith('_cd') || nameLower.endsWith('_code')) {
        return 'status';
    }
    // Date/time detection
    if (nameLower.includes('date') || nameLower.includes('time') || nameLower.includes('timestamp') || nameLower.endsWith('_at') || nameLower.endsWith('_ts')) {
        return 'timestamp';
    }
    // Amount/currency detection
    if (nameLower.includes('amount') || nameLower.includes('price') || nameLower.includes('cost') || nameLower.includes('total') || nameLower.endsWith('_amt') || nameLower.endsWith('_val')) {
        return 'amount';
    }
    // Title/name detection
    if (nameLower.includes('name') || nameLower.includes('title')) {
        return 'title';
    }
    // Description detection
    if (nameLower.includes('desc') || nameLower.includes('description') || nameLower.includes('text') || nameLower.endsWith('_txt')) {
        return 'description';
    }
    // Check value patterns
    if (typeof value === 'string') {
        // ISO date check
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            return 'timestamp';
        }
        // Status code check
        if (/^(STATUS_|STATE_)/i.test(value)) {
            return 'status';
        }
    }
    return 'unknown';
}
// Helper: Map detected type to Zod type
function mapTypeToZod(type) {
    const typeMap = {
        'string': 'z.string()',
        'number': 'z.number()',
        'boolean': 'z.boolean()',
        'null': 'z.null()',
        'array': 'z.array(z.unknown())',
        'object': 'z.record(z.unknown())',
    };
    return typeMap[type] || 'z.unknown()';
}
// Helper: Generate transform body
function generateTransformBody(apiAnalysis) {
    const lines = [];
    for (const field of apiAnalysis.fields) {
        switch (field.semanticType) {
            case 'id':
                lines.push(`    id: data.${field.name},`);
                break;
            case 'title':
            case 'name':
                lines.push(`    title: data.${field.name},`);
                break;
            case 'timestamp':
                lines.push(`    subtitle: formatDate(data.${field.name}),`);
                break;
            case 'status':
                lines.push(`    status: mapStatus(data.${field.name}),`);
                lines.push(`    variant: mapStatusToVariant(data.${field.name}),`);
                break;
            case 'amount':
                lines.push(`    amount: formatCurrency(data.${field.name}),`);
                break;
            case 'description':
                lines.push(`    description: data.${field.name},`);
                break;
            default:
                lines.push(`    ${field.name}: data.${field.name},`);
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=schemaGenerator.js.map