# apps/standalone

CLI for running simulations with Supabase data backend.

## ⚠️ RUNNING COMMANDS - READ THIS FIRST

**DO NOT run `pnpm build` before running commands. DO NOT use `pnpm start`.**

Just run `pnpm dev` directly - it handles everything:

```bash
pnpm dev run -n 1 -d 60
pnpm dev profile -n 100 -d 60
```

- `pnpm dev` = auto-rebuilds deps + runs with tsx (USE THIS)
- `pnpm start` = WRONG, don't use
- `pnpm build` before running = WRONG, unnecessary

## CPU Profiling

**Exception:** `cpu-profile` requires a build because it spawns a separate node process with `--cpu-prof`:

```bash
pnpm build && node --env-file=.env dist/index.js cpu-profile -n 500 beast-mastery
```

Options:
- `-n, --iterations` - number of simulations (default 500)
- `-d, --duration` - simulation duration in seconds (default 60)
- `-t, --top` - number of top functions to show (default 40)

Output shows:
- Category breakdown (effect, node, app, immutable, deps)
- Top functions by CPU sample count
- Profile file path (can open in Chrome DevTools)

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
