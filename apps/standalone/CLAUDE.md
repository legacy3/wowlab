# apps/standalone

CLI for running simulations with Supabase data backend.

## Running

```bash
pnpm start <command>
```

## Structure

```
src/
  index.ts         # CLI entry with @effect/cli
  commands/        # Simulation commands
  data/            # Supabase client for game data
  framework/       # Simulation framework
  rotations/       # Rotation definitions
  rpc/             # RPC for worker communication
  runtime/         # Runtime configuration
  workers/         # Web worker simulation runners
  utils/           # Error formatting, helpers
```

## Data Source

Fetches game data from Supabase at runtime:

```ts
// data/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Requires environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Command Pattern

Uses `@effect/cli`:

```ts
const mainCommand = Command.make("wowlab-standalone", {}, () =>
  Effect.log("Use --help to see available commands"),
).pipe(Command.withSubcommands(commands));
```

## Error Handling

Custom error formatter for user-friendly output:

```ts
Effect.runPromiseExit(program).then((exit) => {
  if (Exit.isFailure(exit)) {
    printFormattedError(exit);
    process.exit(1);
  }
});
```

## Key Conventions

- Requires network access for Supabase data
- Workers for parallel simulation
- Effect-based throughout
