# WowLab MCP Server

MCP (Model Context Protocol) server for querying World of Warcraft spell and item data from the WowLab database.

## Features

- **Spell Data**: Search and retrieve complete spell information including cast time, mana cost, effects, and more
- **Item Data**: Search and retrieve complete item information including stats, item level, quality, and effects
- **Advanced Filtering**: Query data with flexible filters (equality, ranges, pattern matching) on any column
- **Schema Discovery**: Introspect available columns and types to build dynamic queries
- **Zero Configuration**: Works out of the box with WowLab's public Supabase instance
- **Efficient Batch Queries**: Retrieve multiple spells or items in a single request
- **Future-Proof**: Generic filtering adapts automatically when database schema changes

## Installation

### Quick Start (Recommended)

Use npx to run without installation:

```bash
npx @wowlab/mcp-server@latest
```

### Global Installation

```bash
npm install -g @wowlab/mcp-server
```

## Available Tools

### Basic Search & Retrieval

- **`search_spells`** - Search for spells by name
  - Parameters: `query` (string), `limit` (number, optional, max 50)
  - Returns: Array of matching spells with id, name, and description

- **`search_items`** - Search for items by name
  - Parameters: `query` (string), `limit` (number, optional, max 50)
  - Returns: Array of matching items with id, name, and description

- **`get_spell`** - Get complete spell data by ID
  - Parameters: `id` (number)
  - Returns: Full spell object with all properties

- **`get_item`** - Get complete item data by ID
  - Parameters: `id` (number)
  - Returns: Full item object with all properties

- **`get_spells_batch`** / **`get_items_batch`** - Get multiple spells/items efficiently
  - Parameters: `ids` (number[])
  - Returns: Array of full spell/item objects

### Advanced Filtering

- **`query_spells`** - Query spells with flexible filters
  - Parameters: `filters` (object), `limit` (number), `orderBy` (string), `ascending` (boolean)
  - Filter operators: `eq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`
  - Example: Find fire spells: `{ filters: { schoolMask: 4 }, limit: 20 }`
  - Example: Find instant cast spells: `{ filters: { castTime: 0 } }`
  - Example: Find spells with cooldown: `{ filters: { recoveryTime: { gt: 0 } } }`

- **`query_items`** - Query items with flexible filters
  - Parameters: `filters` (object), `limit` (number), `orderBy` (string), `ascending` (boolean)
  - Filter operators: `eq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`
  - Example: Find epic items: `{ filters: { quality: 4 }, limit: 20 }`
  - Example: Find level 60-70 items: `{ filters: { itemLevel: { gte: 60, lte: 70 } } }`
  - Example: Find swords: `{ filters: { name: { ilike: "sword" } } }`

### Schema Discovery

- **`get_spell_schema`** - Get all available spell_data columns and types
  - Use this to discover what fields you can filter by in `query_spells`

- **`get_item_schema`** - Get all available item_data columns and types
  - Use this to discover what fields you can filter by in `query_items`

## Configuration

### Claude Code

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "wowlab": {
      "command": "npx",
      "args": ["-y", "@wowlab/mcp-server@latest"]
    }
  }
}
```

### Windows Troubleshooting

If `npx` doesn't work on Windows (especially with nvm4w), use direct node execution:

**Step 1:** Install globally
```powershell
npm install -g @wowlab/mcp-server
```

**Step 2:** Find your Node.js binary location
```powershell
(Get-Command node).Source
```

**Step 3:** Find your global npm modules location
```powershell
npm root -g
```

**Step 4:** Use this configuration (adjust paths based on your output):
```json
{
  "mcpServers": {
    "wowlab": {
      "command": "C:\\nvm4w\\nodejs\\node.exe",
      "args": ["C:\\nvm4w\\nodejs\\node_modules\\@wowlab\\mcp-server\\bin.mjs"]
    }
  }
}
```

Replace paths with your actual locations from steps 2 and 3.

### Custom Supabase Instance

If you want to use your own Supabase instance:

```json
{
  "mcpServers": {
    "wowlab": {
      "command": "npx",
      "args": ["-y", "@wowlab/mcp-server@latest"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

## Example Usage

```typescript
// Search for fireball spells
await search_spells({ query: "fireball", limit: 5 });

// Get specific spell by ID
await get_spell({ id: 133 });

// Get multiple spells at once
await get_spells_batch({ ids: [133, 2136, 3140] });

// Search for legendary items
await search_items({ query: "thunderfury", limit: 10 });

// Get specific item by ID
await get_item({ id: 19019 });

// Get multiple items at once
await get_items_batch({ ids: [19019, 17182, 18803] });
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev
```

### Publishing

**Important**: The `src/config.ts` file contains Supabase credentials and is gitignored. Before publishing:

1. Ensure `src/config.ts` exists locally with the correct credentials
2. Build the project (`pnpm build`) - this bundles credentials into `build/config.js`
3. The published npm package will include `build/` with bundled credentials
4. Source credentials in `src/config.ts` stay out of git

```bash
# Publish to npm (credentials will be bundled in build/)
npm publish --access public
```

For first-time setup or contributors:

```bash
# Copy example config
cp src/config.example.ts src/config.ts

# Edit src/config.ts with real credentials
# (This file is gitignored and won't be committed)
```

## License

MIT
