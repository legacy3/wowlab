# Phase 4: Replace User-Facing Edge Functions with Direct Queries + RPC

## Problem

The remaining user-facing edge functions (`config-upsert`, `job-create`, `config-fetch`, `rotation-fetch`) are thin wrappers around database operations. They add invocation cost and latency for no real benefit. The portal already has a Supabase client with user JWT auth.

## Replacements

### 1. `config-fetch` → Direct query

Currently an edge function that does `SELECT * FROM jobs_configs WHERE hash = $1`.

**Portal replacement:**
```ts
const { data } = await supabase
  .from('jobs_configs')
  .select('config')
  .eq('hash', configHash)
  .single();
```

**RLS:** Already has public read policy (or add one: `USING (true)` for SELECT).

### 2. `rotation-fetch` → Direct query

Currently an edge function that does `SELECT * FROM rotations WHERE id = $1`.

**Portal replacement:**
```ts
const { data } = await supabase
  .from('rotations')
  .select('script')
  .eq('id', rotationId)
  .single();
```

**RLS:** Already has public read for `is_public = true` rotations.

### 3. `config-upsert` → Direct upsert

Currently an edge function that:
1. Validates user auth
2. SHA-256 hashes the config
3. Validates rotation exists (if rotationId present)
4. Upserts to `jobs_configs`

**Portal replacement:**
```ts
// Hash in browser (Web Crypto API)
const configJson = JSON.stringify(config);
const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(configJson));
const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

// Validate rotation exists (if needed)
if (config.rotationId) {
  const { data } = await supabase
    .from('rotations')
    .select('id')
    .eq('id', config.rotationId)
    .single();
  if (!data) throw new Error('Rotation not found');
}

// Upsert config
const { error } = await supabase
  .from('jobs_configs')
  .upsert({
    hash,
    config,
    last_used_at: new Date().toISOString(),
  }, { onConflict: 'hash' });
```

**RLS policy needed:**
```sql
CREATE POLICY "authenticated_insert_configs"
  ON jobs_configs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_configs"
  ON jobs_configs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 4. `job-create` → Postgres RPC function

This is the complex one — creates a job row + N chunk rows atomically. Perfect use case for a database function.

**Postgres function:**
```sql
CREATE OR REPLACE FUNCTION create_job(
  p_config_hash text,
  p_iterations int,
  p_access_type text DEFAULT 'private',
  p_discord_server_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_job_id uuid;
  v_chunk_size int := 1000;
  v_num_chunks int;
  v_i int;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate config exists
  IF NOT EXISTS (SELECT 1 FROM jobs_configs WHERE hash = p_config_hash) THEN
    RAISE EXCEPTION 'Config not found: %', p_config_hash;
  END IF;

  -- Calculate chunks
  v_num_chunks := CEIL(p_iterations::numeric / v_chunk_size);

  -- Create job
  INSERT INTO jobs (user_id, config_hash, total_iterations, status, access_type, discord_server_id)
  VALUES (v_user_id, p_config_hash, p_iterations, 'pending', p_access_type, p_discord_server_id)
  RETURNING id INTO v_job_id;

  -- Create chunks
  FOR v_i IN 0..(v_num_chunks - 1) LOOP
    INSERT INTO jobs_chunks (job_id, config_hash, iterations, seed_offset, status)
    VALUES (
      v_job_id,
      p_config_hash,
      LEAST(v_chunk_size, p_iterations - (v_i * v_chunk_size)),
      v_i * v_chunk_size,
      'pending'
    );
  END LOOP;

  -- Update config last_used_at
  UPDATE jobs_configs SET last_used_at = now() WHERE hash = p_config_hash;

  RETURN jsonb_build_object(
    'jobId', v_job_id,
    'chunks', v_num_chunks
  );
END;
$$;
```

**Portal call:**
```ts
const { data, error } = await supabase.rpc('create_job', {
  p_config_hash: hash,
  p_iterations: iterations,
  p_access_type: accessType ?? 'private',
  p_discord_server_id: discordServerId ?? null,
});
// data = { jobId: "uuid", chunks: 10 }
```

**Note:** `SECURITY DEFINER` lets the function insert into `jobs` and `jobs_chunks` even if the user doesn't have direct INSERT on those tables. The function itself validates auth via `auth.uid()`.

## Updated `useSubmitJob` Hook

```ts
export function useSubmitJob() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitJobInput): Promise<SubmitJobResult> => {
      // Hash config
      const configJson = JSON.stringify(input.config);
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(configJson)
      );
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Validate rotation if present
      if (input.config.rotationId) {
        const { data } = await supabase
          .from('rotations')
          .select('id')
          .eq('id', input.config.rotationId)
          .single();
        if (!data) throw new Error('Rotation not found');
      }

      // Upsert config
      const { error: configError } = await supabase
        .from('jobs_configs')
        .upsert({
          hash,
          config: input.config,
          last_used_at: new Date().toISOString(),
        }, { onConflict: 'hash' });

      if (configError) throw new Error(configError.message);

      // Create job via RPC
      const { data, error } = await supabase.rpc('create_job', {
        p_config_hash: hash,
        p_iterations: input.iterations,
      });

      if (error) throw new Error(error.message);

      return { jobId: data.jobId, chunks: data.chunks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
```

## RLS Policies Needed

```sql
-- jobs_configs: authenticated users can insert/update
CREATE POLICY "authenticated_insert_configs"
  ON jobs_configs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_last_used"
  ON jobs_configs FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- jobs_configs: anyone can read (for config-fetch replacement)
CREATE POLICY "public_read_configs"
  ON jobs_configs FOR SELECT
  USING (true);

-- jobs: users can read their own jobs
CREATE POLICY "users_read_own_jobs"
  ON jobs FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

## Migration

Create a Supabase migration with:
1. The `create_job` function
2. RLS policies for `jobs_configs`
3. Grant execute on `create_job` to authenticated role

## Steps

1. Create migration with `create_job` RPC function + RLS policies
2. Update `useSubmitJob` hook to use direct upsert + RPC
3. Remove any `supabase.functions.invoke('config-upsert'|'job-create')` calls
4. Replace any `config-fetch` / `rotation-fetch` calls with direct queries
5. Build and verify
6. Delete edge function directories (Phase 6)
