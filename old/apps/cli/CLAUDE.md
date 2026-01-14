# apps/cli

Development CLI for code generation, DBC data management, and local tooling.

## Running

```bash
pnpm cli <command>
```

## Structure

```
commands/
  dbc/              # DBC table operations
  generate-enums/   # Generate TypeScript enums from game data
  generate-schemas/ # Generate Effect schemas from DBC tables
  generate-spells/  # Generate spell definitions
  hello-world/      # Test command
  kill/             # Kill processes
  list-tables/      # List available DBC tables
  upload-dbc/       # Upload DBC data to Supabase
  shared/           # Shared utilities
index.ts            # CLI entry point with @effect/cli
```

## Adding a Command

1. Create folder: `commands/{command-name}/`
2. Export command from `index.ts`
3. Add to `commands/index.ts` exports

## Command Pattern

Uses `@effect/cli` Command:

```ts
import { Command } from "@effect/cli";
import * as Effect from "effect/Effect";

export const myCommand = Command.make(
  "my-command",
  {
    /* options */
  },
  (args) =>
    Effect.gen(function* () {
      // implementation
    }),
);
```

## Environment

Loads `.env` from cli directory. Required vars depend on command (e.g., Supabase keys for upload).

## Key Conventions

- Commands are Effect-based
- Use `NodeContext.layer` for file/network access
- Logging via `@wowlab/services/Log`
