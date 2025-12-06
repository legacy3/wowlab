# Phase 0.2: Seed Database with Mock Data

## Prompt for Claude

```
I'm migrating to Refine. The database tables are created (Phase 0.1).

**YOUR TASK**: Seed the database with the mock data currently hardcoded in the frontend, then remove the client-side mocking.

## Step 1: Create fight_profiles Table

This is static reference data for simulation fight types.

CREATE TABLE fight_profiles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('standard', 'raid', 'dungeon')),
  "order" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO fight_profiles (id, label, description, category, "order") VALUES
  ('patchwerk', 'Patchwerk', 'Single target, stand still', 'standard', 1),
  ('movement', 'Light Movement', 'Single target with periodic movement', 'standard', 2),
  ('aoe', 'Multi-Target', 'Sustained cleave, 3-5 targets', 'standard', 3);

ALTER TABLE fight_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON fight_profiles FOR SELECT USING (true);

## Step 2: Create wanted_items Materialized View

This is derived from simulation data, showing top items by DPS gain. Similar pattern to existing `top_sims_daily` and `spec_rankings_hourly` views.

-- For now, create with static data until we have real sim data with item tracking
-- Later this will be computed from actual simulation stat weight results

CREATE MATERIALIZED VIEW wanted_items AS
SELECT
  row_number() OVER (ORDER BY dps_gain DESC) AS rank,
  id,
  name,
  slot,
  item_level,
  classes,
  dps_gain,
  source,
  quality
FROM (VALUES
  (50363, 'Deathbringer''s Will', 'Trinket', 277, ARRAY['Warrior', 'Paladin', 'Rogue', 'Hunter'], 187, 'Deathbringer Saurfang • ICC 25H', 5),
  (54588, 'Charred Twilight Scale', 'Trinket', 284, ARRAY['Mage', 'Priest', 'Warlock', 'Shaman', 'Druid'], 166, 'Halion • Ruby Sanctum 25H', 4),
  (50365, 'Phylactery of the Nameless Lich', 'Trinket', 277, ARRAY['Mage', 'Priest', 'Warlock', 'Shaman', 'Druid'], 152, 'Professor Putricide • ICC 25H', 4),
  (50070, 'Oathbinder, Charge of the Ranger-General', 'Polearm', 284, ARRAY['Hunter', 'Druid'], 143, 'The Lich King • ICC 25H', 5),
  (51231, 'Sanctified Bloodmage Robe', 'Chest', 277, ARRAY['Mage'], 121, 'Emblem of Frost • Upgrade', 4),
  (51479, 'Wrathful Gladiator''s Compendium', 'Off Hand', 277, ARRAY['Priest', 'Warlock', 'Mage'], 118, 'PvP • Wrathful Season', 4),
  (50034, 'Fal''inrush, Defender of Quel''thalas', 'Ranged', 284, ARRAY['Hunter'], 114, 'The Lich King • ICC 25H', 5),
  (45518, 'Penumbra Pendant', 'Neck', 258, ARRAY['Mage', 'Warlock', 'Priest'], 108, 'Algalon • Ulduar 25H', 4),
  (47610, 'Gul''dan''s Ritualist Pendant', 'Neck', 277, ARRAY['Warlock', 'Priest'], 104, 'Gul''dan • Vault of Archavon', 4),
  (50068, 'Royal Scepter of Terenas II', 'Main Hand', 284, ARRAY['Priest', 'Mage'], 101, 'The Lich King • ICC 25H', 5)
) AS t(id, name, slot, item_level, classes, dps_gain, source, quality);

-- Add comment explaining this is temporary
COMMENT ON MATERIALIZED VIEW wanted_items IS 'Top items by DPS gain. Currently static data, will be computed from sim results when item tracking is implemented.';

-- Create index for common queries
CREATE INDEX wanted_items_rank_idx ON wanted_items (rank);
CREATE INDEX wanted_items_slot_idx ON wanted_items (slot);

## Step 3: Create Sample Rotations

Insert sample rotations that users can browse:

INSERT INTO rotations (id, "userId", namespace, slug, name, description, class, spec, "patchRange", script, visibility, status)
VALUES
  (gen_random_uuid(),
   (SELECT id FROM auth.users LIMIT 1),
   'wowlab',
   'shadow-priest-st',
   'Shadow Priest - Single Target',
   'Optimized single target rotation for Shadow Priest in raid encounters',
   'Priest',
   'Shadow',
   '>=11.0.0',
   '-- Shadow Priest Single Target
actions = shadow_word_pain,if=!dot.shadow_word_pain.ticking
actions = vampiric_touch,if=!dot.vampiric_touch.ticking
actions = mind_blast
actions = devouring_plague,if=insanity>=50
actions = shadow_word_death,if=target.health.pct<20
actions = mind_flay',
   'public',
   'approved'
  ),
  (gen_random_uuid(),
   (SELECT id FROM auth.users LIMIT 1),
   'wowlab',
   'fire-mage-combustion',
   'Fire Mage - Combustion Build',
   'High burst damage rotation centered around Combustion windows',
   'Mage',
   'Fire',
   '>=11.0.0',
   '-- Fire Mage Combustion
actions = combustion,if=cooldown.combustion.ready
actions = pyroblast,if=buff.hot_streak.up
actions = fire_blast,if=buff.heating_up.up
actions = fireball',
   'public',
   'approved'
  ),
  (gen_random_uuid(),
   (SELECT id FROM auth.users LIMIT 1),
   'wowlab',
   'beast-mastery-hunter',
   'Beast Mastery Hunter - Standard',
   'Standard BM Hunter rotation with proper focus management',
   'Hunter',
   'Beast Mastery',
   '>=11.0.0',
   '-- Beast Mastery Hunter
actions = kill_command
actions = barbed_shot,if=pet.main.buff.frenzy.remains<2
actions = bestial_wrath,if=cooldown.bestial_wrath.ready
actions = cobra_shot,if=focus>50
actions = multi_shot,if=active_enemies>2',
   'public',
   'approved'
  );

## Step 4: Create Sample Sim Results

For each rotation, insert some sample simulation results:

INSERT INTO rotation_sim_results ("rotationId", patch, "fightType", duration, iterations, "meanDps", "minDps", "maxDps", "stdDev", scenario, "gearSet", "simVersion")
SELECT
  r.id,
  '11.0.2',
  'patchwerk',
  300,
  10000,
  CASE
    WHEN r.class = 'Priest' THEN 45230
    WHEN r.class = 'Mage' THEN 52150
    WHEN r.class = 'Hunter' THEN 48900
  END,
  CASE
    WHEN r.class = 'Priest' THEN 42100
    WHEN r.class = 'Mage' THEN 48200
    WHEN r.class = 'Hunter' THEN 45600
  END,
  CASE
    WHEN r.class = 'Priest' THEN 48500
    WHEN r.class = 'Mage' THEN 56800
    WHEN r.class = 'Hunter' THEN 52100
  END,
  CASE
    WHEN r.class = 'Priest' THEN 1850
    WHEN r.class = 'Mage' THEN 2100
    WHEN r.class = 'Hunter' THEN 1920
  END,
  'raid-st',
  'bis',
  '1.0.0'
FROM rotations r
WHERE r.namespace = 'wowlab';

## Step 5: Refresh Materialized Views

-- Refresh existing views to pick up new data
REFRESH MATERIALIZED VIEW top_sims_daily;
REFRESH MATERIALIZED VIEW spec_rankings_hourly;

## Step 6: Remove Client-Side Mocking

After data is seeded, update these files to fetch from Supabase instead of using hardcoded data:

1. **atoms/dps-rankings/state.ts**
   - Remove `mostWantedItemsAtom` hardcoded array
   - Create async atom that fetches from `wanted_items` view:

   export const mostWantedItemsAtom = atomWithRefresh(async (get) => {
     const supabase = get(supabaseClientAtom);
     const { data, error } = await supabase
       .from("wanted_items")
       .select("*")
       .order("rank");
     if (error) throw error;
     return data ?? [];
   });

2. **components/simulate/quick-sim-content.tsx**
   - Remove `FIGHT_PROFILES` constant
   - Fetch from `fight_profiles` table or pass as prop
   - Keep `MOCK_PARSED_DATA` for now (real SimC parsing comes later)

3. **atoms/sim/results.ts**
   - This file will be deleted in Phase 0.3
   - Mock gear/character data is UI-only for now

## Verify

1. Query the tables/views to ensure data exists:
   - SELECT * FROM fight_profiles;
   - SELECT * FROM wanted_items ORDER BY rank;
   - SELECT * FROM rotations WHERE visibility = 'public';
   - SELECT * FROM rotation_sim_results;
   - SELECT * FROM top_sims_daily;
   - SELECT * FROM spec_rankings_hourly;

2. Run pnpm build
3. Check that the UI loads the data from the database
```

## Expected Outcome

- `fight_profiles` table created and populated
- `wanted_items` materialized view created
- Sample rotations with sim results exist
- Existing materialized views refreshed
- UI fetches real data instead of mocks

## Checklist

- [ ] Create `fight_profiles` table
- [ ] Insert fight profile data (patchwerk, movement, aoe)
- [ ] Enable RLS on `fight_profiles` with public read
- [ ] Create `wanted_items` materialized view
- [ ] Create indexes on `wanted_items`
- [ ] Insert sample rotations (3 rotations)
- [ ] Insert sample sim results
- [ ] Refresh `top_sims_daily` view
- [ ] Refresh `spec_rankings_hourly` view
- [ ] Verify data in tables/views
- [ ] Update `atoms/dps-rankings/state.ts` to fetch from DB
- [ ] Update `quick-sim-content.tsx` to fetch fight profiles from DB
- [ ] Run `pnpm build`
