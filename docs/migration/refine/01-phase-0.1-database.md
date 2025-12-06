# Phase 0.1: Create Required Database Tables

## Prompt for Claude

```
I'm migrating to Refine for Supabase data management.

**YOUR TASK**: Create the `user_settings` table in Supabase and set up auto-creation on user signup.

## Step 1: Check if trigger function exists

First, check if the update_updated_at_column() function exists:

SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';

If it doesn't exist, create it:

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

## Step 2: Create user_settings Table

Use the Supabase MCP to apply this migration:

CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  "compactMode" BOOLEAN DEFAULT false,
  "showTooltips" BOOLEAN DEFAULT true,
  "defaultFightDuration" INTEGER DEFAULT 300,
  "defaultIterations" INTEGER DEFAULT 1000,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_settings IS 'Private user settings and preferences';
COMMENT ON COLUMN user_settings.theme IS 'UI theme preference';
COMMENT ON COLUMN user_settings."compactMode" IS 'Enable compact UI mode';
COMMENT ON COLUMN user_settings."showTooltips" IS 'Show spell tooltips on hover';
COMMENT ON COLUMN user_settings."defaultFightDuration" IS 'Default simulation fight duration in seconds';
COMMENT ON COLUMN user_settings."defaultIterations" IS 'Default number of simulation iterations';

## Step 3: Enable RLS

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

## Step 4: Create RLS Policies

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

## Step 5: Create Updated Trigger

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

## Step 6: Auto-create settings on user signup

Create a trigger that automatically inserts a user_settings row when a new user signs up.
This ensures useOne() in Phase 6 never returns 404.

CREATE OR REPLACE FUNCTION create_user_settings_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger after user_profiles is created (which happens on signup)
CREATE TRIGGER create_settings_after_profile
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings_on_signup();

## Step 7: Backfill existing users

For any existing users who don't have settings:

INSERT INTO user_settings (id)
SELECT id FROM user_profiles
WHERE id NOT IN (SELECT id FROM user_settings);

## Step 8: Verify

Run these queries to verify:
- SELECT * FROM user_settings; (should have rows for existing users)
- Check RLS is enabled: SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_settings';
- Verify policies exist: SELECT policyname FROM pg_policies WHERE tablename = 'user_settings';
- Verify trigger exists: SELECT tgname FROM pg_trigger WHERE tgname = 'update_user_settings_updated_at';
- Verify auto-create trigger: SELECT tgname FROM pg_trigger WHERE tgname = 'create_settings_after_profile';

## Existing Tables (no changes needed)

These tables already exist and are correct:
- user_profiles (handle, avatar, etc.) - uses camelCase columns
- rotations (scripts, visibility, etc.) - uses camelCase columns
- rotation_sim_results (DPS metrics, etc.) - uses camelCase columns
```

## Expected Outcome

- `user_settings` table created with RLS
- Policies for read/insert/update own settings
- Updated trigger working
- Auto-create trigger on signup
- Existing users backfilled

## Checklist

- [x] Check/create update_updated_at_column() function (using existing `update_timestamp_columns`)
- [x] Create user_settings table (note: uses camelCase for column names)
- [x] Enable RLS on user_settings
- [x] Create SELECT policy (own settings)
- [x] Create INSERT policy (own settings)
- [x] Create UPDATE policy (own settings)
- [x] Create updated_at trigger
- [x] Create auto-create trigger on signup
- [x] Backfill existing users
- [x] Verify table in list_tables
- [x] Verify RLS is enabled
- [x] Verify all triggers work
