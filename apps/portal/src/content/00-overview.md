# Overview

WoW Lab is a browser-based simulation engine for World of Warcraft. It runs entirely client-side using game data from the WoW DBC files.

## What you can do

- **Simulate rotations** - Write and test rotation scripts in JavaScript
- **Inspect spell data** - Browse transformed spell/item data with all computed fields
- **Query game data** - Use the MCP server to query DBC tables with AI assistants

## Architecture

The simulation engine processes combat events the same way the game does. Spells, buffs, damage, and resources are all tracked in an event-driven system.

- **Effect-TS** powers the core simulation runtime
- **Supabase** hosts the spell/item database
- **IndexedDB** caches data locally in your browser

## Getting started

- Check out [MCP Server](/docs/01-mcp-server) to query game data with Claude or Cursor
- Read [Data Flow](/docs/02-data-flow) to understand how the simulation engine works

## Contributing

These docs are just markdown files. You can [view and edit them on GitHub](https://github.com/legacy3/wowlab/tree/main/apps/portal/src/content).
