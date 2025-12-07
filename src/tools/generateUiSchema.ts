import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createUIResource } from '@mcp-ui/server';
import { z } from 'zod';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { generateCardHtml } from '../templates/cardTemplate.js';
import { generateZodSchema, analyzeApiJson, analyzeVueComponent } from '../utils/schemaGenerator.js';

// Tool input schema using Zod object
const GenerateUiSchemaInputSchema = z.object({
    api_json_sample: z.string().describe('A sample JSON response from the backend API'),
    vue_component_code: z.string().describe('The Vue component code from the Design System'),
    output_path: z.string().optional().describe('Optional path to save the HTML preview file (e.g., ./preview.html)'),
});

export function registerGenerateUiSchemaTool(server: McpServer) {
    server.tool(
        'generate_ui_schema',
        'Maps messy API JSON to Vue/React Design System component props using Zod schema. Returns both the generated schema code and a live UI preview. Optionally saves preview as HTML file.',
        GenerateUiSchemaInputSchema.shape,
        async ({ api_json_sample, vue_component_code, output_path }) => {

            try {
                // 1. Parse and analyze inputs
                const apiData = JSON.parse(api_json_sample);
                const apiAnalysis = analyzeApiJson(apiData);
                const componentAnalysis = analyzeVueComponent(vue_component_code);

                // 2. Generate the Zod schema mapping
                const zodSchemaCode = generateZodSchema(apiAnalysis, componentAnalysis);

                // 3. Map the actual data for preview
                const mappedData = mapApiToComponent(apiData, apiAnalysis);

                // 4. Generate HTML preview
                const previewHtml = generateCardHtml(mappedData);

                // 5. Save HTML file if output_path is provided
                let savedFilePath: string | null = null;
                if (output_path) {
                    try {
                        const fullPath = resolve(output_path);
                        mkdirSync(dirname(fullPath), { recursive: true });
                        writeFileSync(fullPath, previewHtml, 'utf-8');
                        savedFilePath = fullPath;
                    } catch (fileError) {
                        // Don't fail the whole operation if file save fails
                        console.error('Failed to save preview file:', fileError);
                    }
                }

                // 6. Create UI Resource for live preview
                const uiPreview = await createUIResource({
                    uri: `ui://glue-code-generator/preview-${Date.now()}`,
                    content: {
                        type: 'rawHtml',
                        htmlString: previewHtml,
                    },
                    encoding: 'text',
                });

                // Build response text
                let responseText = `## Generated Zod Schema\n\n\`\`\`typescript\n${zodSchemaCode}\n\`\`\`\n\n## Mapped Data Preview\n\n\`\`\`json\n${JSON.stringify(mappedData, null, 2)}\n\`\`\``;

                if (savedFilePath) {
                    responseText += `\n\n## 📄 Preview Saved\n\nHTML preview saved to: \`${savedFilePath}\`\n\nOpen this file in a browser to see the rendered preview!`;
                }

                // Return text content with schema + embedded resource for UI preview
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: responseText,
                        },
                        {
                            type: 'resource' as const,
                            resource: uiPreview.resource,
                        },
                    ],
                };

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `❌ Error generating schema: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}

// Map API data to component props based on analysis
function mapApiToComponent(apiData: Record<string, unknown>, analysis: ReturnType<typeof analyzeApiJson>) {
    const mapped: Record<string, unknown> = {};

    for (const field of analysis.fields) {
        const value = apiData[field.name];

        // Map based on detected semantic type
        switch (field.semanticType) {
            case 'id':
                mapped.id = value;
                break;
            case 'title':
            case 'name':
                mapped.title = value;
                break;
            case 'date':
            case 'timestamp':
                mapped.subtitle = formatDate(String(value));
                break;
            case 'status':
                mapped.status = mapStatus(String(value));
                mapped.variant = mapStatusToVariant(String(value));
                break;
            case 'amount':
            case 'currency':
                mapped.amount = formatCurrency(Number(value));
                break;
            case 'description':
                mapped.description = value;
                break;
            default:
                // Fallback - include with original name
                mapped[field.name] = value;
        }
    }

    return mapped;
}

// Helper functions
function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
        'STATUS_OK': 'Completed',
        'STATUS_PENDING': 'Pending',
        'STATUS_ERROR': 'Failed',
        'STATUS_ACTIVE': 'Active',
        'ACTIVE': 'Active',
        'INACTIVE': 'Inactive',
        'OK': 'Success',
        'ERROR': 'Error',
    };
    return statusMap[status.toUpperCase()] || status;
}

function mapStatusToVariant(status: string): string {
    const variantMap: Record<string, string> = {
        'STATUS_OK': 'success',
        'STATUS_PENDING': 'warning',
        'STATUS_ERROR': 'error',
        'STATUS_ACTIVE': 'success',
        'ACTIVE': 'success',
        'INACTIVE': 'neutral',
        'OK': 'success',
        'ERROR': 'error',
    };
    return variantMap[status.toUpperCase()] || 'neutral';
}
