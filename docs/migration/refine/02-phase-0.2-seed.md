# Phase 0.2: Seed Database with Data

## Prompt for Claude

```
I'm migrating to Refine. The database tables are created (Phase 0.1).

**YOUR TASK**: Create the fight_profiles table and view_most_wanted_items materialized view. Seed with initial data. Do NOT modify any frontend code yet - that comes in later phases.

## Step 1: Create fight_profiles Table

This is static reference data for simulation fight types.

CREATE TABLE fight_profiles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('standard', 'raid', 'dungeon')),
  "order" INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE fight_profiles IS 'Static reference data for simulation fight types';

INSERT INTO fight_profiles (id, label, description, category, "order") VALUES
  ('patchwerk', 'Patchwerk', 'Single target, stand still', 'standard', 1),
  ('movement', 'Light Movement', 'Single target with periodic movement', 'standard', 2),
  ('aoe', 'Multi-Target', 'Sustained cleave, 3-5 targets', 'standard', 3);

ALTER TABLE fight_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON fight_profiles FOR SELECT USING (true);

## Step 2: Create view_most_wanted_items Materialized View

This shows top items by DPS gain. Currently static data - will be computed from sim results later when item stat weight tracking is implemented.

Note: Named `view_most_wanted_items` with `view_` prefix to match naming pattern of `view_top_sims_daily` and `view_spec_rankings_hourly`.

CREATE MATERIALIZED VIEW view_most_wanted_items AS
SELECT
  row_number() OVER (ORDER BY "dpsGain" DESC) AS rank,
  id,
  name,
  slot,
  "itemLevel",
  classes,
  "dpsGain",
  source,
  quality
FROM (VALUES
  (50363, 'Deathbringer''s Will', 'Trinket', 277, ARRAY['Warrior', 'Paladin', 'Rogue', 'Hunter'], 187, 'Deathbringer Saurfang - ICC 25H', 5),
  (54588, 'Charred Twilight Scale', 'Trinket', 284, ARRAY['Mage', 'Priest', 'Warlock', 'Shaman', 'Druid'], 166, 'Halion - Ruby Sanctum 25H', 4),
  (50365, 'Phylactery of the Nameless Lich', 'Trinket', 277, ARRAY['Mage', 'Priest', 'Warlock', 'Shaman', 'Druid'], 152, 'Professor Putricide - ICC 25H', 4),
  (50070, 'Oathbinder, Charge of the Ranger-General', 'Polearm', 284, ARRAY['Hunter', 'Druid'], 143, 'The Lich King - ICC 25H', 5),
  (51231, 'Sanctified Bloodmage Robe', 'Chest', 277, ARRAY['Mage'], 121, 'Emblem of Frost - Upgrade', 4),
  (51479, 'Wrathful Gladiator''s Compendium', 'Off Hand', 277, ARRAY['Priest', 'Warlock', 'Mage'], 118, 'PvP - Wrathful Season', 4),
  (50034, 'Fal''inrush, Defender of Quel''thalas', 'Ranged', 284, ARRAY['Hunter'], 114, 'The Lich King - ICC 25H', 5),
  (45518, 'Penumbra Pendant', 'Neck', 258, ARRAY['Mage', 'Warlock', 'Priest'], 108, 'Algalon - Ulduar 25H', 4),
  (47610, 'Gul''dan''s Ritualist Pendant', 'Neck', 277, ARRAY['Warlock', 'Priest'], 104, 'Vault of Archavon 25', 4),
  (50068, 'Royal Scepter of Terenas II', 'Main Hand', 284, ARRAY['Priest', 'Mage'], 101, 'The Lich King - ICC 25H', 5)
) AS t(id, name, slot, "itemLevel", classes, "dpsGain", source, quality);

COMMENT ON MATERIALIZED VIEW view_most_wanted_items IS 'Top items by DPS gain. Currently static data, will be computed from sim results when item tracking is implemented.';

CREATE INDEX view_most_wanted_items_rank_idx ON view_most_wanted_items (rank);
CREATE INDEX view_most_wanted_items_slot_idx ON view_most_wanted_items (slot);

## Step 3: Create Sample Rotations (Optional)

If you want sample data for testing, insert some rotations. Otherwise skip this - real users will create rotations.

-- Only run this if you need test data
-- Get an existing user ID first:
-- SELECT id FROM user_profiles LIMIT 1;

-- Then insert (replace USER_ID_HERE with actual UUID):
-- INSERT INTO rotations (id, "userId", namespace, slug, name, description, class, spec, "patchRange", script, visibility, status)
-- VALUES (
--   gen_random_uuid(),
--   'USER_ID_HERE',
--   'wowlab',
--   'shadow-priest-st',
--   'Shadow Priest - Single Target',
--   'Optimized single target rotation',
--   'Priest',
--   'Shadow',
--   '>=11.0.0',
--   'actions = shadow_word_pain,if=!dot.shadow_word_pain.ticking',
--   'public',
--   'approved'
-- );

## Step 4: Refresh Existing Materialized Views

Refresh the existing views to ensure they're up to date:

REFRESH MATERIALIZED VIEW view_top_sims_daily;
REFRESH MATERIALIZED VIEW view_spec_rankings_hourly;

## Step 5: Verify

Run these queries to verify:

-- Check fight_profiles
SELECT * FROM fight_profiles ORDER BY "order";

-- Check view_most_wanted_items
SELECT rank, name, slot, "dpsGain" FROM view_most_wanted_items ORDER BY rank LIMIT 5;

-- Check existing views still work
SELECT COUNT(*) FROM view_top_sims_daily;
SELECT COUNT(*) FROM view_spec_rankings_hourly;

## DO NOT DO in this phase

- Do NOT modify any frontend/atom code yet
- Do NOT update mostWantedItemsAtom - it will be replaced by Refine hooks in Phase 5
- Do NOT update FIGHT_PROFILES constant - it will be replaced in Phase 5
- Just seed the database - frontend changes come later
```

## Expected Outcome

- `fight_profiles` table created and populated
- `view_most_wanted_items` materialized view created with initial data
- Existing materialized views refreshed
- No frontend code changes

## Checklist

- [ ] Create `fight_profiles` table
- [ ] Insert fight profile data (patchwerk, movement, aoe)
- [ ] Enable RLS on `fight_profiles` with public read
- [ ] Create `view_most_wanted_items` materialized view
- [ ] Create indexes on `view_most_wanted_items` (rank, slot)
- [ ] Refresh `view_top_sims_daily` view
- [ ] Refresh `view_spec_rankings_hourly` view
- [ ] Verify data in tables/views
- [ ] Run `pnpm build` (should still pass - no code changes)
