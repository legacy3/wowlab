# Plan: Simulation Flow Refactor

## Goal

Clean implementation where:
1. Portal builds `SimConfig` with `rotationId` reference (not script)
2. `sim_configs` stores config by hash
3. Node receives only `configHash`
4. Node fetches config + rotation on-demand, caches both locally
5. `rotations` table has `checksum` for cache invalidation

---

## Target Flow

```
Portal                          Edge Functions                  Node
───────                         ──────────────                  ────
useRustSimConfig.build()
  → loadSpellsById()
  → loadAurasById()
  → buildSimConfig({ rotationId })
  → hashSimConfig()
        │
        ▼
POST /config-upsert { hash, config }
POST /job-create { configHash, iterations }
                                        │
                                        ▼
                                verify configHash exists
                                create job + chunks
                                        │
                                        ▼
                                chunk-claim returns:
                                { chunks, configHash }
                                                                │
                                                                ▼
                                                        if !cache.has(configHash):
                                                          GET /config-fetch?hash=X
                                                          cache config

                                                        rotationId = config.rotationId
                                                        if !cache.has(rotationId, checksum):
                                                          GET /rotation-fetch?id=X
                                                          cache rotation

                                                        run simulation
```

---

## Tasks

### 1. Database: Add checksum to rotations

```sql
ALTER TABLE rotations ADD COLUMN checksum TEXT;

-- Populate existing rows
UPDATE rotations SET checksum = encode(sha256(script::bytea), 'hex');

-- Trigger to auto-update on script change
CREATE OR REPLACE FUNCTION update_rotation_checksum()
RETURNS TRIGGER AS $$
BEGIN
  NEW.checksum = encode(sha256(NEW.script::bytea), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rotation_checksum_trigger
BEFORE INSERT OR UPDATE OF script ON rotations
FOR EACH ROW EXECUTE FUNCTION update_rotation_checksum();
```

### 2. Update SimConfig type

**File:** `apps/portal/src/lib/simulation/rust-config-builder.ts`

```typescript
export interface SimConfig {
  player: PlayerConfig;
  pet?: PetConfig;
  spells: SpellDef[];
  auras: AuraDef[];
  duration: number;
  target: TargetConfig;
  rotationId: string;  // UUID reference, not script
}

export interface BuildSimConfigOptions {
  spells: Schemas.Spell.SpellDataFlat[];
  auras: Schemas.Aura.AuraDataFlat[];
  duration: number;
  rotationId: string;  // UUID
  player?: Partial<PlayerConfig>;
  pet?: Partial<PetConfig>;
  target?: Partial<TargetConfig>;
}
```

### 3. Update useDistributedSimulation

**File:** `apps/portal/src/hooks/rotations/use-distributed-simulation.ts`

```typescript
const { build } = useRustSimConfig();

// rotationId comes from the editor (saved rotation) or create one first
const { config, hash } = await build({
  spellIds,
  duration: 300,
  rotationId,  // UUID of saved rotation
});

await fetch("/functions/v1/config-upsert", {
  body: JSON.stringify({ hash, config }),
});

await fetch("/functions/v1/job-create", {
  body: JSON.stringify({ configHash: hash, iterations: 10000 }),
});
```

### 4. Edge Function: config-upsert

**New file:** `supabase/functions/config-upsert/index.ts`

```typescript
Deno.serve(async (req: Request) => {
  const { hash, config } = await req.json();

  // Verify hash
  const computed = await sha256(JSON.stringify(config));
  if (computed !== hash) {
    return jsonResponse({ error: "Hash mismatch" }, 400);
  }

  // Verify rotationId exists
  const { data: rotation } = await supabase
    .from("rotations")
    .select("id")
    .eq("id", config.rotationId)
    .single();

  if (!rotation) {
    return jsonResponse({ error: "Rotation not found" }, 400);
  }

  await supabase.from("sim_configs").upsert(
    { hash, config, lastUsedAt: new Date().toISOString() },
    { onConflict: "hash" }
  );

  return jsonResponse({ success: true });
});
```

### 5. Edge Function: Update job-create

**File:** `supabase/functions/job-create/index.ts`

```typescript
Deno.serve(async (req: Request) => {
  // Auth check...

  const { configHash, iterations } = await req.json();

  // Verify config exists
  const { data: configExists } = await supabase
    .from("sim_configs")
    .select("hash")
    .eq("hash", configHash)
    .single();

  if (!configExists) {
    return jsonResponse({ error: "Config not found" }, 400);
  }

  // Create job + chunks as before, but no config hashing here
  const { data: job } = await supabase
    .from("sim_jobs")
    .insert({ userId: user.id, configHash, totalIterations: iterations, status: "pending" })
    .select("id")
    .single();

  // Create chunks...
  // Broadcast...

  return jsonResponse({ jobId: job.id, chunks: numChunks });
});
```

### 6. Edge Function: Update chunk-claim

**File:** `supabase/functions/chunk-claim/index.ts`

Remove config from response:

```typescript
return jsonResponse({
  chunks: claimedChunks.map(c => ({
    id: c.id,
    iterations: c.iterations,
    seedOffset: c.seedOffset,
  })),
  configHash,  // Node fetches config separately
});
```

### 7. Edge Function: config-fetch

**New file:** `supabase/functions/config-fetch/index.ts`

```typescript
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const hash = url.searchParams.get("hash");

  const { data } = await supabase
    .from("sim_configs")
    .select("config")
    .eq("hash", hash)
    .single();

  if (!data) {
    return jsonResponse({ error: "Not found" }, 404);
  }

  return new Response(JSON.stringify(data.config), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});
```

### 8. Edge Function: rotation-fetch

**New file:** `supabase/functions/rotation-fetch/index.ts`

```typescript
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const { data } = await supabase
    .from("rotations")
    .select("id, script, checksum")
    .eq("id", id)
    .single();

  if (!data) {
    return jsonResponse({ error: "Not found" }, 404);
  }

  return jsonResponse({
    id: data.id,
    script: data.script,
    checksum: data.checksum,
  });
});
```

### 9. Node: Add caches

**File:** `crates/node-core/src/cache.rs` (new)

```rust
use std::collections::HashMap;
use std::sync::RwLock;

pub struct ConfigCache {
    configs: RwLock<HashMap<String, SimConfig>>,  // hash -> config
    rotations: RwLock<HashMap<String, CachedRotation>>,  // id -> (script, checksum)
}

pub struct CachedRotation {
    pub script: String,
    pub checksum: String,
}

impl ConfigCache {
    pub fn get_config(&self, hash: &str) -> Option<SimConfig> {
        self.configs.read().ok()?.get(hash).cloned()
    }

    pub fn insert_config(&self, hash: String, config: SimConfig) {
        if let Ok(mut cache) = self.configs.write() {
            cache.insert(hash, config);
        }
    }

    pub fn get_rotation(&self, id: &str, expected_checksum: &str) -> Option<String> {
        let cache = self.rotations.read().ok()?;
        let cached = cache.get(id)?;
        if cached.checksum == expected_checksum {
            Some(cached.script.clone())
        } else {
            None  // Checksum mismatch, need refetch
        }
    }

    pub fn insert_rotation(&self, id: String, script: String, checksum: String) {
        if let Ok(mut cache) = self.rotations.write() {
            cache.insert(id, CachedRotation { script, checksum });
        }
    }
}
```

### 10. Node: Add fetch methods

**File:** `crates/node-core/src/supabase/client.rs`

```rust
pub async fn fetch_config(&self, hash: &str) -> Result<SimConfig> {
    let url = format!("{}/functions/v1/config-fetch?hash={}", self.api_url, hash);
    let response = self.client.get(&url)
        .header("apikey", &self.anon_key)
        .send().await?;
    Ok(response.json().await?)
}

pub async fn fetch_rotation(&self, id: &str) -> Result<RotationResponse> {
    let url = format!("{}/functions/v1/rotation-fetch?id={}", self.api_url, id);
    let response = self.client.get(&url)
        .header("apikey", &self.anon_key)
        .send().await?;
    Ok(response.json().await?)
}

#[derive(Deserialize)]
pub struct RotationResponse {
    pub id: String,
    pub script: String,
    pub checksum: String,
}
```

### 11. Node: Update work processing

**File:** `crates/node-core/src/core.rs`

```rust
async fn process_claimed_chunks(&mut self, response: ClaimResponse) -> Result<()> {
    // 1. Get config (fetch if not cached)
    let config = match self.cache.get_config(&response.config_hash) {
        Some(c) => c,
        None => {
            let fetched = self.client.fetch_config(&response.config_hash).await?;
            self.cache.insert_config(response.config_hash.clone(), fetched.clone());
            fetched
        }
    };

    // 2. Get rotation (fetch if not cached or checksum changed)
    let rotation_id = &config.rotation_id;
    let rotation = self.client.fetch_rotation(rotation_id).await?;

    let script = match self.cache.get_rotation(rotation_id, &rotation.checksum) {
        Some(s) => s,
        None => {
            self.cache.insert_rotation(
                rotation_id.clone(),
                rotation.script.clone(),
                rotation.checksum.clone()
            );
            rotation.script
        }
    };

    // 3. Submit work
    for chunk in response.chunks {
        self.worker_pool.submit(WorkItem {
            chunk_id: chunk.id,
            config: config.clone(),
            rotation_script: script.clone(),
            iterations: chunk.iterations,
            seed_offset: chunk.seed_offset,
        }).await?;
    }

    Ok(())
}
```

---

## Delete Old Code

### Portal
- [ ] Remove inline config building from `use-distributed-simulation.ts`
- [ ] Remove `extractSpellIds` if moved to `rust-config-builder`

### Edge Functions
- [ ] Remove config hashing from `job-create`
- [ ] Remove config fetch from `chunk-claim` response

---

## Schema Changes

```sql
-- Add checksum to rotations
ALTER TABLE rotations ADD COLUMN checksum TEXT;
UPDATE rotations SET checksum = encode(sha256(script::bytea), 'hex');

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_rotation_checksum()
RETURNS TRIGGER AS $$
BEGIN
  NEW.checksum = encode(sha256(NEW.script::bytea), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rotation_checksum_trigger
BEFORE INSERT OR UPDATE OF script ON rotations
FOR EACH ROW EXECUTE FUNCTION update_rotation_checksum();
```

---

## API Summary

| Endpoint | Input | Output |
|----------|-------|--------|
| `config-upsert` | `{ hash, config }` | `{ success }` |
| `job-create` | `{ configHash, iterations }` | `{ jobId, chunks }` |
| `chunk-claim` | `{ nodeId, batchSize }` | `{ chunks, configHash }` |
| `config-fetch` | `?hash=X` | `SimConfig` JSON |
| `rotation-fetch` | `?id=X` | `{ id, script, checksum }` |

---

## Testing

- [ ] Create rotation, verify checksum populated
- [ ] Update rotation script, verify checksum changes
- [ ] Portal builds config with rotationId
- [ ] Portal uploads config, creates job
- [ ] Node claims chunks, gets configHash only
- [ ] Node fetches config on cache miss
- [ ] Node fetches rotation on cache miss
- [ ] Node uses cached rotation when checksum matches
- [ ] Node refetches rotation when checksum differs
- [ ] Simulation completes successfully
