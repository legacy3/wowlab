# WowLab MCP Server

MCP (Model Context Protocol) server for querying World of Warcraft spell and item data from the WowLab database.

## Features

- **Full Spell/Item Data**: Get complete transformed data including all computed fields
- **DBC Table Access**: Query 25+ game data tables directly
- **Extractor Functions**: Call 17 specialized functions to compute damage, durations, cooldowns, etc.
- **Schema Discovery**: Introspect available tables and columns
- **Zero Configuration**: Works out of the box with the WowLab database
- **Efficient Batch Queries**: Retrieve multiple spells or items in a single request

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

### Spell & Item Retrieval

| Tool               | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `get_spell`        | Get complete spell data by ID (transformed with all computed fields) |
| `get_item`         | Get complete item data by ID (transformed with all computed fields)  |
| `get_spells_batch` | Get multiple spells by ID (max 50)                                   |
| `get_items_batch`  | Get multiple items by ID (max 50)                                    |
| `search_spells`    | Search spells by name                                                |
| `search_items`     | Search items by name                                                 |

### DBC Table Access

| Tool          | Description                                                      |
| ------------- | ---------------------------------------------------------------- |
| `query_table` | Query DBC tables with filters, sorting, and column selection     |
| `get_schema`  | List available tables or get column details for a specific table |

**Available Tables:**

- Spell: `spell`, `spell_name`, `spell_misc`, `spell_effect`, `spell_power`, `spell_cooldowns`, `spell_categories`, `spell_category`, `spell_class_options`, `spell_cast_times`, `spell_duration`, `spell_range`, `spell_radius`, `spell_interrupts`, `spell_empower`, `spell_empower_stage`, `spell_aura_options`
- Item: `item`, `item_sparse`, `item_effect`, `item_x_item_effect`
- Shared: `difficulty`, `expected_stat`, `expected_stat_mod`, `content_tuning_x_expected`

### Extractor Functions

| Tool             | Description                                        |
| ---------------- | -------------------------------------------------- |
| `call_function`  | Call an extractor function to compute derived data |
| `list_functions` | List available extractor functions with signatures |

**Available Functions:**

- `getDamage` - Calculate spell damage for a level/difficulty
- `getEffectsForDifficulty` - Get spell effects filtered by difficulty
- `getVarianceForDifficulty` - Get damage variance for difficulty
- `hasAoeDamageEffect` - Check if spell has AoE damage
- `extractCooldown` - Get cooldown info
- `extractCastTime` - Get cast time
- `extractDuration` - Get duration
- `extractRange` - Get range
- `extractRadius` - Get AoE radius
- `extractCharges` - Get charge info
- `extractPower` - Get resource costs
- `extractScaling` - Get SP/AP coefficients
- `extractEmpower` - Get Evoker empower stages
- `extractInterrupts` - Get interrupt flags
- `extractClassOptions` - Get class restrictions
- `extractName` - Get spell name
- `extractDescription` - Get spell description

### Utility

| Tool         | Description                               |
| ------------ | ----------------------------------------- |
| `get_status` | Check server health and connection status |

## Configuration

### Claude Code

Add to your Claude Code MCP settings:

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

**Step 2:** Find your Node.js binary and global modules location

```powershell
(Get-Command node).Source
npm root -g
```

**Step 3:** Use this configuration (adjust paths based on your output):

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

## Example Usage

```typescript
// Get Fireball spell (ID 133)
await get_spell({ id: 133 });

// Search for fire spells
await search_spells({ query: "fire", limit: 10 });

// Get multiple spells at once
await get_spells_batch({ ids: [133, 2136, 3140] });

// Query raw spell_effect table for damage effects
await query_table({
  table: "spell_effect",
  filters: { EffectIndex: 0 },
  limit: 20,
});

// Get spell damage for Mythic difficulty
await call_function({
  function: "getDamage",
  args: { spellId: 133, difficultyId: 16 },
});

// List all tables
await get_schema({});

// Get columns for spell_misc table
await get_schema({ table: "spell_misc" });
```

## License

MIT
