# Node Total Cores Migration

This migration adds `totalCores` to track the total available CPU cores on a node, separate from `maxParallel` (enabled/configured workers).

## Database Migration

```sql
-- Add totalCores column to user_nodes table
ALTER TABLE user_nodes
ADD COLUMN "totalCores" integer NOT NULL DEFAULT 4;

-- Backfill existing nodes: set totalCores = maxParallel
UPDATE user_nodes SET "totalCores" = "maxParallel";
```

## Edge Function Update: `node-register`

Update the function to accept the new request body format:

### Request Body (before)
```json
{
  "hostname": "My-PC",
  "cores": 8,
  "version": "0.1.0"
}
```

### Request Body (after)
```json
{
  "hostname": "My-PC",
  "totalCores": 16,
  "enabledCores": 8,
  "version": "0.1.0"
}
```

### Implementation

```typescript
interface RegisterRequest {
  hostname: string;
  totalCores: number;
  enabledCores: number;
  version: string;
}

// In the handler:
const { hostname, totalCores, enabledCores, version } = await req.json() as RegisterRequest;

const { data, error } = await supabase
  .from('user_nodes')
  .insert({
    name: hostname,
    totalCores,
    maxParallel: enabledCores,
    version,
    status: 'pending',
    claimCode: generateClaimCode(),
  })
  .select('id, claimCode')
  .single();
```

## What Changed

### Rust Node (`crates/node`)

| File | Change |
|------|--------|
| `src/utils/cpu.rs` | Added `get_total_cores()`, Linux aarch64 big.LITTLE detection |
| `src/claim.rs` | Added `total_cores()` and `default_enabled_cores()` |
| `src/supabase/client.rs` | `register_node()` sends `totalCores` + `enabledCores` |
| `src/supabase/realtime.rs` | `NodePayload` includes `total_cores` |

### Portal (`apps/portal`)

| File | Change |
|------|--------|
| `src/lib/supabase/database.types.ts` | Added `totalCores` to `user_nodes` types |
| `src/providers/node-manager.tsx` | Added `totalCores` to `NodeListItem`, `PendingNodeInfo` |
| `src/components/nodes/node-claim-form.tsx` | Slider max uses `totalCores` |
| `src/components/nodes/node-settings-sheet.tsx` | Added workers slider for remote nodes |

## Behavior

- **`totalCores`**: Total logical CPU cores available on the node (slider maximum)
- **`maxParallel`**: Currently enabled workers (user-configurable, defaults to optimal)

### Optimal Core Detection

The Rust node detects optimal cores based on architecture:

| Platform | Strategy |
|----------|----------|
| aarch64 + macOS | P-cores only via `sysctl hw.perflevel0.logicalcpu` |
| aarch64 + Linux | Big cores via `/sys/devices/system/cpu/*/cpu_capacity` |
| x86_64 | Physical cores (no hyperthreading) |
| Other | All logical cores |
