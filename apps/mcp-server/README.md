# WowLab MCP Server

MCP (Model Context Protocol) server for querying World of Warcraft spell and item data from the WowLab database.

## Features

- **Spell Data**: Search and retrieve complete spell information including cast time, mana cost, effects, and more
- **Item Data**: Search and retrieve complete item information including stats, item level, quality, and effects
- **Zero Configuration**: Works out of the box with WowLab's public Supabase instance
- **Efficient Batch Queries**: Retrieve multiple spells or items in a single request

## Installation

### Quick Start (Recommended)

Use npx to run without installation:

```bash
npx wowlab-mcp@latest
```

### Global Installation

```bash
npm install -g wowlab-mcp
```

## Available Tools

### Spell Tools

- **`search_spells`** - Search for spells by name
  - Parameters: `query` (string), `limit` (number, optional, max 50)
  - Returns: Array of matching spells with id, name, and description

- **`get_spell`** - Get complete spell data by ID
  - Parameters: `id` (number)
  - Returns: Full spell object with all properties

- **`get_spells_batch`** - Get multiple spells efficiently
  - Parameters: `ids` (number[])
  - Returns: Array of full spell objects

### Item Tools

- **`search_items`** - Search for items by name
  - Parameters: `query` (string), `limit` (number, optional, max 50)
  - Returns: Array of matching items with id, name, and description

- **`get_item`** - Get complete item data by ID
  - Parameters: `id` (number)
  - Returns: Full item object with all properties

- **`get_items_batch`** - Get multiple items efficiently
  - Parameters: `ids` (number[])
  - Returns: Array of full item objects

## Configuration

### Claude Code

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "wowlab": {
      "command": "npx",
      "args": ["-y", "wowlab-mcp@latest"]
    }
  }
}
```

### Custom Supabase Instance

If you want to use your own Supabase instance:

```json
{
  "mcpServers": {
    "wowlab": {
      "command": "npx",
      "args": ["-y", "wowlab-mcp@latest"],
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
npm publish
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
