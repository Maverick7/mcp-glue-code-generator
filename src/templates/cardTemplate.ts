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

export function generateCardHtml(data: CardData): string {
    const variant = data.variant || 'neutral';
    const variantColors: Record<string, { bg: string; text: string; border: string }> = {
        success: { bg: '#10B981', text: '#ECFDF5', border: '#059669' },
        warning: { bg: '#F59E0B', text: '#FFFBEB', border: '#D97706' },
        error: { bg: '#EF4444', text: '#FEF2F2', border: '#DC2626' },
        neutral: { bg: '#6B7280', text: '#F9FAFB', border: '#4B5563' },
    };

    const colors = variantColors[variant] || variantColors.neutral;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      padding: 28px;
      max-width: 380px;
      width: 100%;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      animation: slideUp 0.5s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .card-title {
      color: #fff;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .card-id {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 4px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: ${colors.bg};
      color: ${colors.text};
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .badge::before {
      content: '';
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .card-subtitle {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.875rem;
      margin-bottom: 16px;
    }

    .card-description {
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.9375rem;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .card-amount {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .amount-label {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .amount-value {
      color: #fff;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .powered-by {
      margin-top: 20px;
      text-align: center;
      color: rgba(255, 255, 255, 0.3);
      font-size: 0.625rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">${escapeHtml(data.title || 'Card Title')}</div>
        ${data.id ? `<div class="card-id">${escapeHtml(String(data.id))}</div>` : ''}
      </div>
      ${data.status ? `<span class="badge">${escapeHtml(data.status)}</span>` : ''}
    </div>
    
    ${data.subtitle ? `<div class="card-subtitle">${escapeHtml(data.subtitle)}</div>` : ''}
    ${data.description ? `<div class="card-description">${escapeHtml(String(data.description))}</div>` : ''}
    
    ${data.amount ? `
    <div class="card-amount">
      <span class="amount-label">Amount</span>
      <span class="amount-value">${escapeHtml(data.amount)}</span>
    </div>
    ` : ''}
    
    <div class="powered-by">Rendered by MCP-UI • Glue Code Generator</div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, char => htmlEntities[char] || char);
}
