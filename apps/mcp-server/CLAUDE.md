# apps/mcp-server

MCP (Model Context Protocol) server exposing WoW data to AI assistants.

## Running

Used by Claude Code and other MCP clients. Configured in `.mcp.json` or MCP settings.

## Structure

```
src/
  index.ts       # Server entry, Layer composition
  toolkit.ts     # Tool definitions (Tool.make)
  handlers.ts    # Tool implementation handlers
  schemas.ts     # Input/output schemas
  supabase.ts    # Supabase client for data fetching
  config.ts      # Environment config
```

## Architecture

Uses `@effect/ai` for MCP server:

```ts
import { McpServer } from "@effect/ai";

const McpServerLayer = McpServer.layerStdio({
  name: "wowlab",
  stdin: NodeStream.stdin,
  stdout: NodeSink.stdout,
  version: pkg.version,
});

const ToolkitLayer = Layer.effectDiscard(
  McpServer.registerToolkit(WowLabToolkit),
);
```

## Tool Pattern

Tools defined with `Tool.make`, handlers separate:

```ts
// toolkit.ts
import { Tool, Toolkit } from "@effect/ai";

export const GetSpell = Tool.make("get_spell", {
  description: "...",
  parameters: {
    id: Schema.Number.annotations({ description: "The spell ID" }),
  },
  success: Schema.Unknown,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Idempotent, true);

export const WowLabToolkit = Toolkit.make(GetSpell, GetItem, ...);
```

Handlers in separate file:

```ts
// handlers.ts
export const WowLabToolHandlers = Layer.effect(
  Tool.handlers(WowLabToolkit),
  Effect.gen(function* () {
    return Tool.makeHandlers(WowLabToolkit, {
      get_spell: (input) => Effect.gen(function* () { ... }),
    });
  }),
);
```

## Data Source

Fetches from Supabase via `SupabaseDbcServiceLayer`.

## Key Conventions

- Tools return structured data, not formatted text
- Use Effect for all async operations
- Errors should be descriptive for AI consumption
