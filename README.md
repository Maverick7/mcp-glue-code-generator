# MCP UI Glue Code Generator

> 🎯 **The Grand Slam Demo**: Maps messy API JSON to **Vue OR React** Design System components using Zod schemas, with live UI previews via MCP-UI.

## ✨ What is this?

This is a **Two-Stage System** for automating frontend integration:

1. **Stage 1 (Factory)**: Takes "Messy API JSON" + "Design System Component" (Vue or React) → Generates **Zod Schema** mapping
2. **Stage 2 (Runtime)**: Renders a live preview using `mcp-ui` directly in your chat

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Start the server
npm start
```

Server will be running at:
- **Health Check**: http://localhost:3000/
- **MCP Endpoint**: http://localhost:3000/mcp

## 🔧 VS Code Integration

### Option 1: Roo Code / Cline Extension

Add to your VS Code settings (`settings.json`):

```json
{
  "roo-cline.mcpServers": {
    "glue-code-generator": {
      "command": "node",
      "args": ["d:/MCPUIPlugin/build/index.js"]
    }
  }
}
```

### Option 2: Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "glue-code-generator": {
      "command": "node",
      "args": ["d:/MCPUIPlugin/build/index.js"]
    }
  }
}
```

## 🎮 Demo Walkthrough

### The "Magic Moment"

1. Open your AI chat (VS Code with Roo Code, or Claude Desktop)
2. Paste this prompt:

```
Map this API response to this Vue component:

API Response:
{
  "cust_id": "USR-12345",
  "tx_timestamp": "2025-12-06T10:30:00Z",
  "stat_cd": "STATUS_OK",
  "amt_val": 1250.50,
  "desc_txt": "Monthly subscription payment"
}

Vue Component:
<template>
  <div class="ds-card" :class="variant">
    <h3>{{ title }}</h3>
    <p class="subtitle">{{ subtitle }}</p>
    <span class="amount">{{ formattedAmount }}</span>
    <span class="badge" :class="variant">{{ status }}</span>
  </div>
</template>
```

3. **Result**: The tool generates the Zod schema **AND** renders the actual card live in chat!

## 🧪 Testing with MCP Inspector

```bash
# Quick CLI test
npx @modelcontextprotocol/inspector --cli http://localhost:3000/mcp --method tools/list

# Or use the GUI
npx @modelcontextprotocol/inspector
# Then connect to http://localhost:3000/mcp with Streamable HTTP
```

## 📦 Tool Reference

### `generate_ui_schema`

Maps API JSON to Vue component props.

**Inputs:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `api_json_sample` | string | JSON response from backend API |
| `vue_component_code` | string | Vue component from Design System |

**Outputs:**
- Generated Zod schema code
- Mapped data preview
- Live HTML card rendered via `mcp-ui`

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Client                           │
│         (VS Code / Claude Desktop / Goose)              │
└────────────────────────┬────────────────────────────────┘
                         │ MCP Protocol
                         ▼
┌─────────────────────────────────────────────────────────┐
│             glue-code-generator Server                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │         generate_ui_schema Tool                  │   │
│  │  ┌───────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │  Analyze  │→ │  Generate   │→ │  Render   │  │   │
│  │  │  API JSON │  │ Zod Schema  │  │ UIResource│  │   │
│  │  └───────────┘  └─────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Publishing & Distribution

### Option 1: Smithery (MCP Marketplace)
The official way for users to discover and install MCP servers:
1. Create account at [smithery.ai](https://smithery.ai)
2. Submit your server with metadata
3. Users can browse and add via: `smithery install glue-code-generator`

### Option 2: npm Package
Publish to npm for `npx` usage:
```bash
npm publish
# Users run: npx @yourname/glue-code-generator
```

### Option 3: GitHub
Users clone/download and configure manually in their MCP client settings.

> **Note**: VS Code doesn't have a built-in MCP browser yet. Users configure MCP servers in their settings or use extensions like Roo Code/Cline.

## 📄 License

MIT
