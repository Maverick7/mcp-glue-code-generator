/**
 * Card Template Generator
 * Creates beautiful HTML card previews for UIResource rendering
 */
interface CardData {
    id?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    amount?: string;
    status?: string;
    variant?: string;
    [key: string]: unknown;
}
export declare function generateCardHtml(data: CardData): string;
export {};
//# sourceMappingURL=cardTemplate.d.ts.map