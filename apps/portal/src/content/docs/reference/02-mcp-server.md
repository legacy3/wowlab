---
title: MCP Server
description: Query WoW spell/item data with AI tools
updatedAt: 2025-12-17
---

# MCP Server

Query WoW spell and item data from any MCP-compatible tool.

## What it's for

The MCP server gives AI assistants (Claude, Cursor, etc.) access to WoW's game data. Ask questions like "what's the cooldown of Fireball?" or "compare the damage of these two trinkets" and the assistant can look it up directly.

**Not limited to WoW Lab users.** Anyone can use this to query WoW data for theorycrafting, building tools, or exploring game mechanics. Please use it responsibly.

## Install

**Claude Code:**

```bash
claude mcp add wowlab -- npx -y @wowlab/mcp-server@latest
```

**Other tools:** Add to your MCP config:

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

## What you can query

- Spell data (damage, cooldowns, costs, effects)
- Item data (stats, effects, procs)
- Raw DBC tables for advanced queries
- Computed values (scaling coefficients, damage calculations)

Just ask your AI assistant what you want to know. It will figure out which tools to use.

## Links

- [npm](https://www.npmjs.com/package/@wowlab/mcp-server)
- [Source](https://github.com/legacy3/wowlab/tree/main/apps/mcp-server)
