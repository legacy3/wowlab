# Phase 0.1: Create Required Database Tables

## Prompt for Claude

```
I'm migrating to Refine for Supabase data management.

**YOUR TASK**: Create the `user_settings` table in Supabase. This stores private user preferences (class, spec, UI settings).

## Step 1: Create user_settings Table

Use the Supabase MCP to apply this migration:

CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  class TEXT,
  spec TEXT,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  compactMode BOOLEAN DEFAULT false,
  showTooltips BOOLEAN DEFAULT true,
  defaultFightDuration INTEGER DEFAULT 300,
  defaultIterations INTEGER DEFAULT 1000,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_settings IS 'Private user settings and preferences';
COMMENT ON COLUMN user_settings.class IS 'Selected WoW class (e.g. warrior, mage)';
COMMENT ON COLUMN user_settings.spec IS 'Selected specialization (e.g. arms, frost)';
COMMENT ON COLUMN user_settings.theme IS 'UI theme preference';
COMMENT ON COLUMN user_settings.compactMode IS 'Enable compact UI mode';
COMMENT ON COLUMN user_settings.showTooltips IS 'Show spell tooltips on hover';
COMMENT ON COLUMN user_settings.defaultFightDuration IS 'Default simulation fight duration in seconds';
COMMENT ON COLUMN user_settings.defaultIterations IS 'Default number of simulation iterations';

## Step 2: Enable RLS

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

## Step 3: Create RLS Policies

-- Users can only read their own settings
CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

## Step 4: Create Updated Trigger

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

(Note: If update_updated_at_column() doesn't exist, create it first:)

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

## Step 5: Verify

Run these queries to verify:
- SELECT * FROM user_settings; (should return empty)
- Check RLS is enabled in list_tables output
- Verify policies exist

## Existing Tables (no changes needed)

These tables already exist and are correct:
- user_profiles (handle, avatar, etc.)
- rotations (scripts, visibility, etc.)
- rotation_sim_results (DPS metrics, etc.)
```

## Expected Outcome

- `user_settings` table created with RLS
- Policies for read/insert/update own settings
- Updated trigger working

## Checklist

- [ ] Create user_settings table
- [ ] Enable RLS on user_settings
- [ ] Create SELECT policy (own settings)
- [ ] Create INSERT policy (own settings)
- [ ] Create UPDATE policy (own settings)
- [ ] Create/verify updated_at trigger
- [ ] Verify table in list_tables
- [ ] Verify RLS is enabled
