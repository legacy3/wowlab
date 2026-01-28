


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "game";


ALTER SCHEMA "game" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_handle_not_reserved"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF NEW.handle IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_reserved_handles WHERE handle = NEW.handle
  ) THEN
    RAISE EXCEPTION 'Handle "%" is reserved', NEW.handle;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_handle_not_reserved"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_job"("p_config" "jsonb", "p_iterations" integer, "p_access_type" "text" DEFAULT 'private'::"text", "p_discord_server_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id uuid;
  v_job_id uuid;
  v_config_hash text;
  v_chunk_size int := 1000;
  v_num_chunks int;
  v_i int;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Compute SHA-256 hash of the config
  v_config_hash := encode(digest(p_config::text, 'sha256'), 'hex');

  -- Upsert config (idempotent by hash)
  INSERT INTO jobs_configs (hash, config, last_used_at)
  VALUES (v_config_hash, p_config, now())
  ON CONFLICT (hash) DO UPDATE SET last_used_at = now();

  -- Calculate chunks
  v_num_chunks := CEIL(p_iterations::numeric / v_chunk_size);

  -- Create job
  INSERT INTO jobs (user_id, config_hash, total_iterations, status, access_type, discord_server_id)
  VALUES (v_user_id, v_config_hash, p_iterations, 'pending', p_access_type, p_discord_server_id)
  RETURNING id INTO v_job_id;

  -- Create chunks
  FOR v_i IN 0..(v_num_chunks - 1) LOOP
    INSERT INTO jobs_chunks (job_id, config_hash, iterations, seed_offset, status)
    VALUES (
      v_job_id,
      v_config_hash,
      LEAST(v_chunk_size, p_iterations - (v_i * v_chunk_size)),
      v_i * v_chunk_size,
      'pending'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'jobId', v_job_id,
    'chunks', v_num_chunks
  );
END;
$$;


ALTER FUNCTION "public"."create_job"("p_config" "jsonb", "p_iterations" integer, "p_access_type" "text", "p_discord_server_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_job"("p_config_hash" "text", "p_iterations" integer, "p_access_type" "text" DEFAULT 'private'::"text", "p_discord_server_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."create_job"("p_config_hash" "text", "p_iterations" integer, "p_access_type" "text", "p_discord_server_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_rotation_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.current_version := 1;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.script IS DISTINCT FROM NEW.script THEN
    INSERT INTO public.rotations_versions (rotation_id, version, script, created_by)
    VALUES (OLD.id, OLD.current_version, OLD.script, OLD.user_id);
    NEW.current_version := OLD.current_version + 1;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_rotation_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_own_account"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  _handle text;
BEGIN
  SELECT handle INTO _handle FROM public.user_profiles WHERE id = auth.uid();

  IF _handle IS NOT NULL THEN
    INSERT INTO public.user_reserved_handles (handle, reason)
    VALUES (_handle, 'Account deleted')
    ON CONFLICT (handle) DO NOTHING;
  END IF;

  DELETE FROM public.rotations_versions WHERE created_by = auth.uid();
  DELETE FROM public.rotations WHERE user_id = auth.uid();
  DELETE FROM public.nodes WHERE user_id = auth.uid();
  DELETE FROM public.jobs WHERE user_id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."delete_own_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_default_handle"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  base_handle text;
  final_handle text;
  counter integer := 0;
BEGIN
  base_handle := 'user-' || substr(user_id::text, 1, 6);
  final_handle := base_handle;
  
  WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE handle = final_handle) LOOP
    counter := counter + 1;
    final_handle := base_handle || '-' || counter;
  END LOOP;
  
  RETURN final_handle;
END;
$$;


ALTER FUNCTION "public"."generate_default_handle"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_random_seed"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT encode(extensions.gen_random_bytes(6), 'hex');
$$;


ALTER FUNCTION "public"."generate_random_seed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_short_url"("p_target_url" "text", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_slug text;
  v_attempts int := 0;
BEGIN
  SELECT slug INTO v_slug FROM public.short_urls WHERE target_url = p_target_url;
  IF v_slug IS NOT NULL THEN RETURN v_slug; END IF;

  LOOP
    v_slug := encode(extensions.gen_random_bytes(4), 'hex');
    BEGIN
      INSERT INTO public.short_urls (slug, target_url) VALUES (v_slug, p_target_url);
      RETURN v_slug;
    EXCEPTION WHEN unique_violation THEN
      v_attempts := v_attempts + 1;
      IF v_attempts > 10 THEN
        RAISE EXCEPTION 'Failed to generate unique slug after 10 attempts';
      END IF;
    END;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."get_or_create_short_url"("p_target_url" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_friendship_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- On INSERT or status change to accepted/blocked, increment both users
    IF TG_OP = 'INSERT' THEN
        -- Only increment on accepted (immediate accept) or pending (request sent)
        IF NEW.status IN ('accepted', 'pending') THEN
            PERFORM increment_permission_generation(NEW.user_a_id);
            PERFORM increment_permission_generation(NEW.user_b_id);
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Increment on status changes that affect permissions
        IF OLD.status != NEW.status AND NEW.status IN ('accepted', 'declined', 'blocked') THEN
            PERFORM increment_permission_generation(NEW.user_a_id);
            PERFORM increment_permission_generation(NEW.user_b_id);
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Always increment on delete (unfriend)
        PERFORM increment_permission_generation(OLD.user_a_id);
        PERFORM increment_permission_generation(OLD.user_b_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."handle_friendship_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_guild_member_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    member_id uuid;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- User joined guild: increment their generation and all existing members
        PERFORM increment_permission_generation(NEW.user_id);
        FOR member_id IN SELECT user_id FROM guild_members WHERE guild_id = NEW.guild_id AND user_id != NEW.user_id LOOP
            PERFORM increment_permission_generation(member_id);
        END LOOP;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Role change: only increment the affected user
        IF OLD.role != NEW.role THEN
            PERFORM increment_permission_generation(NEW.user_id);
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- User left guild: increment their generation and all remaining members
        PERFORM increment_permission_generation(OLD.user_id);
        FOR member_id IN SELECT user_id FROM guild_members WHERE guild_id = OLD.guild_id LOOP
            PERFORM increment_permission_generation(member_id);
        END LOOP;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."handle_guild_member_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, handle)
  VALUES (NEW.id, public.generate_default_handle(NEW.id))
  ON CONFLICT (id) DO UPDATE SET updated_at = now();

  INSERT INTO public.user_settings (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_node_visibility_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Increment owner's generation when node ownership or visibility changes
    IF NEW.user_id IS NOT NULL THEN
        PERFORM increment_permission_generation(NEW.user_id);
    END IF;
    
    -- If ownership changed, also increment old owner
    IF TG_OP = 'UPDATE' AND OLD.user_id IS NOT NULL AND OLD.user_id != NEW.user_id THEN
        PERFORM increment_permission_generation(OLD.user_id);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_node_visibility_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_node_visibility_config_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.user_id IS NOT NULL AND OLD.visibility IS DISTINCT FROM NEW.visibility THEN
        PERFORM increment_permission_generation(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_node_visibility_config_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_pending_chunk"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.node_id IS NULL THEN
    PERFORM pg_notify('pending_chunk', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_pending_chunk"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_claim_code"("p_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_node record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, name, platform, total_cores, max_parallel
  INTO v_node
  FROM nodes
  WHERE claim_code = upper(replace(p_code, '-', ''))
    AND user_id IS NULL;

  IF v_node IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired claim code';
  END IF;

  RETURN jsonb_build_object(
    'id', v_node.id,
    'name', v_node.name,
    'platform', v_node.platform,
    'totalCores', v_node.total_cores,
    'maxParallel', v_node.max_parallel
  );
END;
$$;


ALTER FUNCTION "public"."verify_claim_code"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_node"("p_node_id" "uuid", "p_name" "text", "p_max_parallel" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id uuid;
  v_node record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE nodes
  SET user_id = v_user_id,
      name = p_name,
      max_parallel = p_max_parallel,
      claim_code = NULL
  WHERE id = p_node_id
    AND user_id IS NULL
  RETURNING id, name, max_parallel, status, platform, total_cores, version, created_at
  INTO v_node;

  IF v_node IS NULL THEN
    RAISE EXCEPTION 'Node not found or already claimed';
  END IF;

  RETURN jsonb_build_object(
    'id', v_node.id,
    'name', v_node.name,
    'maxParallel', v_node.max_parallel,
    'status', v_node.status,
    'platform', v_node.platform,
    'totalCores', v_node.total_cores
  );
END;
$$;


ALTER FUNCTION "public"."claim_node"("p_node_id" "uuid", "p_name" "text", "p_max_parallel" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_handle_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Allow setting handle from NULL (first-time setup)
  IF OLD.handle IS NULL AND NEW.handle IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Allow changing from default handle (starts with "user-") to custom handle
  -- This enables one-time customization from the auto-generated handle
  IF OLD.handle IS NOT NULL 
     AND OLD.handle LIKE 'user-%' 
     AND NEW.handle IS NOT NULL 
     AND NEW.handle NOT LIKE 'user-%' THEN
    RETURN NEW;
  END IF;
  
  -- Prevent any other changes once handle is set to a custom value
  IF OLD.handle IS NOT NULL AND OLD.handle != NEW.handle THEN
    RAISE EXCEPTION 'Handle cannot be changed once set';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_handle_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_rotation_checksum"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.checksum = encode(sha256(NEW.script::bytea), 'hex');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_rotation_checksum"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp_columns"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "game"."auras" (
    "spell_id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "base_duration_ms" integer DEFAULT 0 NOT NULL,
    "max_duration_ms" integer DEFAULT 0 NOT NULL,
    "max_stacks" integer DEFAULT 1 NOT NULL,
    "periodic_type" "text",
    "tick_period_ms" integer DEFAULT 0 NOT NULL,
    "refresh_behavior" "text" DEFAULT 'pandemic'::"text" NOT NULL,
    "duration_hasted" boolean DEFAULT false NOT NULL,
    "hasted_ticks" boolean DEFAULT false NOT NULL,
    "pandemic_refresh" boolean DEFAULT false NOT NULL,
    "rolling_periodic" boolean DEFAULT false NOT NULL,
    "tick_may_crit" boolean DEFAULT false NOT NULL,
    "tick_on_application" boolean DEFAULT false NOT NULL
);


ALTER TABLE "game"."auras" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "game"."classes" (
    "id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "filename" "text" DEFAULT ''::"text" NOT NULL,
    "icon_file_id" integer DEFAULT 0 NOT NULL,
    "color" "text" DEFAULT '#FFFFFF'::"text" NOT NULL,
    "spell_class_set" integer DEFAULT 0 NOT NULL,
    "primary_stat_priority" integer DEFAULT 0 NOT NULL,
    "roles_mask" integer DEFAULT 0 NOT NULL,
    "file_name" "text" DEFAULT 'inv_misc_questionmark'::"text" NOT NULL
);


ALTER TABLE "game"."classes" OWNER TO "postgres";


COMMENT ON TABLE "game"."classes" IS 'WoW class data from ChrClasses DBC - synced via CLI';



COMMENT ON COLUMN "game"."classes"."file_name" IS 'Resolved icon filename from manifest_interface_data (e.g., classicon_warrior)';



CREATE TABLE IF NOT EXISTS "game"."curve_points" (
    "id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "curve_id" integer NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "pos_0" double precision DEFAULT 0 NOT NULL,
    "pos_1" double precision DEFAULT 0 NOT NULL,
    "pos_pre_squish_0" double precision DEFAULT 0 NOT NULL,
    "pos_pre_squish_1" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE "game"."curve_points" OWNER TO "postgres";


COMMENT ON TABLE "game"."curve_points" IS 'WoW CurvePoint DBC - interpolation points for curves';



COMMENT ON COLUMN "game"."curve_points"."pos_0" IS 'X value (input, e.g., player level)';



COMMENT ON COLUMN "game"."curve_points"."pos_1" IS 'Y value (output, e.g., scaled item level)';



COMMENT ON COLUMN "game"."curve_points"."pos_pre_squish_0" IS 'Pre-stat-squish X value for historical compatibility';



COMMENT ON COLUMN "game"."curve_points"."pos_pre_squish_1" IS 'Pre-stat-squish Y value for historical compatibility';



CREATE TABLE IF NOT EXISTS "game"."curves" (
    "id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" integer DEFAULT 0 NOT NULL,
    "flags" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "game"."curves" OWNER TO "postgres";


COMMENT ON TABLE "game"."curves" IS 'WoW Curve DBC - curve definitions for stat/level scaling';



CREATE TABLE IF NOT EXISTS "game"."global_colors" (
    "id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#FFFFFF'::"text" NOT NULL
);


ALTER TABLE "game"."global_colors" OWNER TO "postgres";


COMMENT ON TABLE "game"."global_colors" IS 'WoW UI color constants from GlobalColor DBC - synced via CLI';



CREATE TABLE IF NOT EXISTS "game"."global_strings" (
    "id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tag" "text" NOT NULL,
    "value" "text" DEFAULT ''::"text" NOT NULL,
    "flags" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "game"."global_strings" OWNER TO "postgres";


COMMENT ON TABLE "game"."global_strings" IS 'WoW localized UI strings from GlobalStrings DBC - synced via CLI';



CREATE TABLE IF NOT EXISTS "game"."item_bonuses" (
    "id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "value_0" integer DEFAULT 0 NOT NULL,
    "value_1" integer DEFAULT 0 NOT NULL,
    "value_2" integer DEFAULT 0 NOT NULL,
    "value_3" integer DEFAULT 0 NOT NULL,
    "parent_item_bonus_list_id" integer DEFAULT 0 NOT NULL,
    "type" integer DEFAULT 0 NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "game"."item_bonuses" OWNER TO "postgres";


COMMENT ON TABLE "game"."item_bonuses" IS 'WoW ItemBonus DBC - bonus effects applied by bonus_id';



COMMENT ON COLUMN "game"."item_bonuses"."parent_item_bonus_list_id" IS 'Groups multiple bonus entries together - lookup key for bonus_id';



COMMENT ON COLUMN "game"."item_bonuses"."type" IS 'Bonus type enum: 1=ILEVEL, 2=MOD, 3=SOCKET, 11=SCALING, 13=SCALING_2, 42=SET_ILEVEL_2, etc.';



CREATE TABLE IF NOT EXISTS "game"."items" (
    "id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "file_name" "text" DEFAULT 'inv_misc_questionmark'::"text" NOT NULL,
    "item_level" integer DEFAULT 0 NOT NULL,
    "quality" integer DEFAULT 0 NOT NULL,
    "required_level" integer DEFAULT 0 NOT NULL,
    "binding" integer DEFAULT 0 NOT NULL,
    "buy_price" integer DEFAULT 0 NOT NULL,
    "sell_price" integer DEFAULT 0 NOT NULL,
    "max_count" integer DEFAULT 0 NOT NULL,
    "stackable" integer DEFAULT 1 NOT NULL,
    "speed" integer DEFAULT 0 NOT NULL,
    "class_id" integer DEFAULT 0 NOT NULL,
    "subclass_id" integer DEFAULT 0 NOT NULL,
    "inventory_type" integer DEFAULT 0 NOT NULL,
    "classification" "jsonb",
    "stats" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "effects" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "sockets" integer[] DEFAULT '{}'::integer[] NOT NULL,
    "socket_bonus_enchant_id" integer DEFAULT 0 NOT NULL,
    "flags" integer[] DEFAULT '{}'::integer[] NOT NULL,
    "allowable_class" integer DEFAULT '-1'::integer NOT NULL,
    "allowable_race" bigint DEFAULT '-1'::integer NOT NULL,
    "expansion_id" integer DEFAULT 0 NOT NULL,
    "item_set_id" integer DEFAULT 0 NOT NULL,
    "set_info" "jsonb",
    "drop_sources" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "dmg_variance" real DEFAULT 0 NOT NULL,
    "gem_properties" integer DEFAULT 0 NOT NULL,
    "modified_crafting_reagent_item_id" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "game"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "game"."rand_prop_points" (
    "id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "damage_replace_stat_f" double precision DEFAULT 0 NOT NULL,
    "damage_secondary_f" double precision DEFAULT 0 NOT NULL,
    "damage_replace_stat" integer DEFAULT 0 NOT NULL,
    "damage_secondary" integer DEFAULT 0 NOT NULL,
    "epic_f_0" double precision DEFAULT 0 NOT NULL,
    "epic_f_1" double precision DEFAULT 0 NOT NULL,
    "epic_f_2" double precision DEFAULT 0 NOT NULL,
    "epic_f_3" double precision DEFAULT 0 NOT NULL,
    "epic_f_4" double precision DEFAULT 0 NOT NULL,
    "superior_f_0" double precision DEFAULT 0 NOT NULL,
    "superior_f_1" double precision DEFAULT 0 NOT NULL,
    "superior_f_2" double precision DEFAULT 0 NOT NULL,
    "superior_f_3" double precision DEFAULT 0 NOT NULL,
    "superior_f_4" double precision DEFAULT 0 NOT NULL,
    "good_f_0" double precision DEFAULT 0 NOT NULL,
    "good_f_1" double precision DEFAULT 0 NOT NULL,
    "good_f_2" double precision DEFAULT 0 NOT NULL,
    "good_f_3" double precision DEFAULT 0 NOT NULL,
    "good_f_4" double precision DEFAULT 0 NOT NULL,
    "epic_0" integer DEFAULT 0 NOT NULL,
    "epic_1" integer DEFAULT 0 NOT NULL,
    "epic_2" integer DEFAULT 0 NOT NULL,
    "epic_3" integer DEFAULT 0 NOT NULL,
    "epic_4" integer DEFAULT 0 NOT NULL,
    "superior_0" integer DEFAULT 0 NOT NULL,
    "superior_1" integer DEFAULT 0 NOT NULL,
    "superior_2" integer DEFAULT 0 NOT NULL,
    "superior_3" integer DEFAULT 0 NOT NULL,
    "superior_4" integer DEFAULT 0 NOT NULL,
    "good_0" integer DEFAULT 0 NOT NULL,
    "good_1" integer DEFAULT 0 NOT NULL,
    "good_2" integer DEFAULT 0 NOT NULL,
    "good_3" integer DEFAULT 0 NOT NULL,
    "good_4" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "game"."rand_prop_points" OWNER TO "postgres";


COMMENT ON TABLE "game"."rand_prop_points" IS 'WoW RandPropPoints DBC - stat budgets per item level by quality tier';



COMMENT ON COLUMN "game"."rand_prop_points"."id" IS 'Item level (1-639+)';



CREATE TABLE IF NOT EXISTS "game"."specs" (
    "id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "class_id" integer NOT NULL,
    "class_name" "text" DEFAULT ''::"text" NOT NULL,
    "role" integer DEFAULT 0 NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "icon_file_id" integer DEFAULT 0 NOT NULL,
    "primary_stat_priority" integer DEFAULT 0 NOT NULL,
    "mastery_spell_id_0" integer DEFAULT 0 NOT NULL,
    "mastery_spell_id_1" integer DEFAULT 0 NOT NULL,
    "file_name" "text" DEFAULT 'inv_misc_questionmark'::"text" NOT NULL
);


ALTER TABLE "game"."specs" OWNER TO "postgres";


COMMENT ON TABLE "game"."specs" IS 'Flat specialization data from DBC - synced via CLI';



COMMENT ON COLUMN "game"."specs"."file_name" IS 'Resolved icon filename from manifest_interface_data (e.g., spell_holy_holybolt)';



CREATE TABLE IF NOT EXISTS "game"."specs_traits" (
    "spec_id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "spec_name" "text" NOT NULL,
    "class_name" "text" NOT NULL,
    "tree_id" integer NOT NULL,
    "all_node_ids" integer[] DEFAULT '{}'::integer[] NOT NULL,
    "nodes" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "edges" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "sub_trees" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "point_limits" "jsonb" DEFAULT '{"hero": 0, "spec": 0, "class": 0}'::"jsonb" NOT NULL
);


ALTER TABLE "game"."specs_traits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "game"."spells" (
    "id" integer NOT NULL,
    "patch_version" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "aura_description" "text" DEFAULT ''::"text" NOT NULL,
    "description_variables" "text" DEFAULT ''::"text" NOT NULL,
    "file_name" "text" DEFAULT 'inv_misc_questionmark'::"text" NOT NULL,
    "is_passive" boolean DEFAULT false NOT NULL,
    "knowledge_source" "jsonb" DEFAULT '{"source": "unknown"}'::"jsonb" NOT NULL,
    "cast_time" integer DEFAULT 0 NOT NULL,
    "recovery_time" integer DEFAULT 0 NOT NULL,
    "start_recovery_time" integer DEFAULT 1500 NOT NULL,
    "mana_cost" integer DEFAULT 0 NOT NULL,
    "power_cost" integer DEFAULT 0 NOT NULL,
    "power_cost_pct" real DEFAULT 0 NOT NULL,
    "power_type" integer DEFAULT '-1'::integer NOT NULL,
    "charge_recovery_time" integer DEFAULT 0 NOT NULL,
    "max_charges" integer DEFAULT 0 NOT NULL,
    "range_max_0" real DEFAULT 0 NOT NULL,
    "range_max_1" real DEFAULT 0 NOT NULL,
    "range_min_0" real DEFAULT 0 NOT NULL,
    "range_min_1" real DEFAULT 0 NOT NULL,
    "cone_degrees" real DEFAULT 0 NOT NULL,
    "radius_max" real DEFAULT 0 NOT NULL,
    "radius_min" real DEFAULT 0 NOT NULL,
    "defense_type" integer DEFAULT 0 NOT NULL,
    "school_mask" integer DEFAULT 0 NOT NULL,
    "bonus_coefficient_from_ap" real DEFAULT 0 NOT NULL,
    "effect_bonus_coefficient" real DEFAULT 0 NOT NULL,
    "interrupt_aura_0" integer DEFAULT 0 NOT NULL,
    "interrupt_aura_1" integer DEFAULT 0 NOT NULL,
    "interrupt_channel_0" integer DEFAULT 0 NOT NULL,
    "interrupt_channel_1" integer DEFAULT 0 NOT NULL,
    "interrupt_flags" integer DEFAULT 0 NOT NULL,
    "duration" integer DEFAULT 0 NOT NULL,
    "max_duration" integer DEFAULT 0 NOT NULL,
    "can_empower" boolean DEFAULT false NOT NULL,
    "empower_stages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "dispel_type" integer DEFAULT 0 NOT NULL,
    "facing_caster_flags" integer DEFAULT 0 NOT NULL,
    "speed" real DEFAULT 0 NOT NULL,
    "spell_class_mask_1" integer DEFAULT 0 NOT NULL,
    "spell_class_mask_2" integer DEFAULT 0 NOT NULL,
    "spell_class_mask_3" integer DEFAULT 0 NOT NULL,
    "spell_class_mask_4" integer DEFAULT 0 NOT NULL,
    "spell_class_set" integer DEFAULT 0 NOT NULL,
    "base_level" integer DEFAULT 0 NOT NULL,
    "max_level" integer DEFAULT 0 NOT NULL,
    "max_passive_aura_level" integer DEFAULT 0 NOT NULL,
    "spell_level" integer DEFAULT 0 NOT NULL,
    "caster_aura_spell" integer DEFAULT 0 NOT NULL,
    "caster_aura_state" integer DEFAULT 0 NOT NULL,
    "exclude_caster_aura_spell" integer DEFAULT 0 NOT NULL,
    "exclude_caster_aura_state" integer DEFAULT 0 NOT NULL,
    "exclude_target_aura_spell" integer DEFAULT 0 NOT NULL,
    "exclude_target_aura_state" integer DEFAULT 0 NOT NULL,
    "target_aura_spell" integer DEFAULT 0 NOT NULL,
    "target_aura_state" integer DEFAULT 0 NOT NULL,
    "replacement_spell_id" integer DEFAULT 0 NOT NULL,
    "shapeshift_exclude_0" integer DEFAULT 0 NOT NULL,
    "shapeshift_exclude_1" integer DEFAULT 0 NOT NULL,
    "shapeshift_mask_0" integer DEFAULT 0 NOT NULL,
    "shapeshift_mask_1" integer DEFAULT 0 NOT NULL,
    "stance_bar_order" integer DEFAULT 0 NOT NULL,
    "required_totem_category_0" integer DEFAULT 0 NOT NULL,
    "required_totem_category_1" integer DEFAULT 0 NOT NULL,
    "totem_0" integer DEFAULT 0 NOT NULL,
    "totem_1" integer DEFAULT 0 NOT NULL,
    "attributes" integer[] DEFAULT '{}'::integer[] NOT NULL,
    "effect_trigger_spell" integer[] DEFAULT '{}'::integer[] NOT NULL,
    "implicit_target" integer[] DEFAULT '{}'::integer[] NOT NULL,
    "learn_spells" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "effects" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "game"."spells" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "config_hash" "text" NOT NULL,
    "total_iterations" integer NOT NULL,
    "completed_iterations" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "access_type" "text" DEFAULT 'private'::"text" NOT NULL,
    "discord_server_id" "text"
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "node_id" "uuid",
    "config_hash" "text" NOT NULL,
    "iterations" integer NOT NULL,
    "seed_offset" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "result" "jsonb",
    "claimed_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."jobs_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs_configs" (
    "hash" "text" NOT NULL,
    "config" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."jobs_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" DEFAULT 'My Node'::"text" NOT NULL,
    "max_parallel" integer DEFAULT 4 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "last_seen_at" timestamp with time zone,
    "version" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "total_cores" integer DEFAULT 4 NOT NULL,
    "platform" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "public_key" "text" NOT NULL,
    "claim_code" "text"
);


ALTER TABLE "public"."nodes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nodes_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "node_id" "uuid" NOT NULL,
    "access_type" "text" NOT NULL,
    "target_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nodes_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "script" "text" NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "forked_from_id" "uuid",
    "spec_id" integer NOT NULL,
    "current_version" integer DEFAULT 1 NOT NULL,
    "checksum" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rotations_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rotation_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "script" "text" NOT NULL,
    "message" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rotations_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."short_urls" (
    "slug" "text" NOT NULL,
    "target_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."short_urls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sim_profiles" (
    "id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."sim_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "handle" "text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reserved_handles" (
    "handle" "text" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_reserved_handles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'system'::"text" NOT NULL,
    "compact_mode" boolean DEFAULT false NOT NULL,
    "show_tooltips" boolean DEFAULT true NOT NULL,
    "default_fight_duration" integer DEFAULT 300 NOT NULL,
    "default_iterations" integer DEFAULT 10000 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "game"."auras"
    ADD CONSTRAINT "auras_pkey" PRIMARY KEY ("spell_id");



ALTER TABLE ONLY "game"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "game"."curve_points"
    ADD CONSTRAINT "curve_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "game"."curves"
    ADD CONSTRAINT "curves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "game"."global_colors"
    ADD CONSTRAINT "global_colors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "game"."global_strings"
    ADD CONSTRAINT "global_strings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "game"."global_strings"
    ADD CONSTRAINT "global_strings_tag_key" UNIQUE ("tag");



ALTER TABLE ONLY "game"."item_bonuses"
    ADD CONSTRAINT "item_bonuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "game"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "game"."rand_prop_points"
    ADD CONSTRAINT "rand_prop_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "game"."specs"
    ADD CONSTRAINT "specs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "game"."specs_traits"
    ADD CONSTRAINT "specs_traits_pkey" PRIMARY KEY ("spec_id");



ALTER TABLE ONLY "game"."spells"
    ADD CONSTRAINT "spells_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs_chunks"
    ADD CONSTRAINT "jobs_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs_configs"
    ADD CONSTRAINT "jobs_configs_pkey" PRIMARY KEY ("hash");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nodes_permissions"
    ADD CONSTRAINT "nodes_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nodes"
    ADD CONSTRAINT "nodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nodes"
    ADD CONSTRAINT "nodes_public_key_key" UNIQUE ("public_key");



ALTER TABLE ONLY "public"."nodes"
    ADD CONSTRAINT "nodes_claim_code_key" UNIQUE ("claim_code");



ALTER TABLE ONLY "public"."rotations"
    ADD CONSTRAINT "rotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rotations"
    ADD CONSTRAINT "rotations_user_id_slug_key" UNIQUE ("user_id", "slug");



ALTER TABLE ONLY "public"."rotations_versions"
    ADD CONSTRAINT "rotations_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rotations_versions"
    ADD CONSTRAINT "rotations_versions_rotation_id_version_key" UNIQUE ("rotation_id", "version");



ALTER TABLE ONLY "public"."short_urls"
    ADD CONSTRAINT "short_urls_pkey" PRIMARY KEY ("slug");



ALTER TABLE ONLY "public"."sim_profiles"
    ADD CONSTRAINT "sim_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_handle_key" UNIQUE ("handle");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_reserved_handles"
    ADD CONSTRAINT "user_reserved_handles_pkey" PRIMARY KEY ("handle");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



CREATE INDEX "curve_points_curve_id_idx" ON "game"."curve_points" USING "btree" ("curve_id");



CREATE INDEX "idx_auras_patch" ON "game"."auras" USING "btree" ("patch_version");



CREATE INDEX "idx_global_colors_name" ON "game"."global_colors" USING "btree" ("name");



CREATE INDEX "idx_global_strings_tag" ON "game"."global_strings" USING "btree" ("tag");



CREATE INDEX "idx_items_ilevel" ON "game"."items" USING "btree" ("item_level");



CREATE INDEX "idx_items_name" ON "game"."items" USING "gin" ("to_tsvector"('"english"'::"regconfig", "name"));



CREATE INDEX "idx_items_patch" ON "game"."items" USING "btree" ("patch_version");



CREATE INDEX "idx_specs_class" ON "game"."specs" USING "btree" ("class_id");



CREATE INDEX "idx_specs_patch" ON "game"."specs" USING "btree" ("patch_version");



CREATE INDEX "idx_specs_traits_patch" ON "game"."specs_traits" USING "btree" ("patch_version");



CREATE INDEX "idx_spells_name" ON "game"."spells" USING "gin" ("to_tsvector"('"english"'::"regconfig", "name"));



CREATE INDEX "idx_spells_patch" ON "game"."spells" USING "btree" ("patch_version");



CREATE INDEX "item_bonuses_parent_id_idx" ON "game"."item_bonuses" USING "btree" ("parent_item_bonus_list_id");



CREATE INDEX "idx_jobs_chunks_config_hash" ON "public"."jobs_chunks" USING "btree" ("config_hash");



CREATE INDEX "idx_jobs_chunks_job_id" ON "public"."jobs_chunks" USING "btree" ("job_id");



CREATE INDEX "idx_jobs_chunks_node_pending" ON "public"."jobs_chunks" USING "btree" ("node_id", "status") WHERE ("status" = ANY (ARRAY['pending'::"text", 'claimed'::"text"]));



CREATE INDEX "idx_jobs_config_hash" ON "public"."jobs" USING "btree" ("config_hash");



CREATE INDEX "idx_jobs_user_status" ON "public"."jobs" USING "btree" ("user_id", "status");



CREATE INDEX "idx_nodes_permissions_node_id" ON "public"."nodes_permissions" USING "btree" ("node_id");



CREATE INDEX "idx_nodes_public_key" ON "public"."nodes" USING "btree" ("public_key") WHERE ("public_key" IS NOT NULL);



CREATE INDEX "idx_nodes_user_id" ON "public"."nodes" USING "btree" ("user_id");



CREATE INDEX "idx_rotations_versions_created_by" ON "public"."rotations_versions" USING "btree" ("created_by");



CREATE INDEX "rotations_forked_from_id_idx" ON "public"."rotations" USING "btree" ("forked_from_id") WHERE ("forked_from_id" IS NOT NULL);



CREATE INDEX "rotations_is_public_idx" ON "public"."rotations" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "rotations_user_id_idx" ON "public"."rotations" USING "btree" ("user_id");



CREATE INDEX "short_urls_target_url_idx" ON "public"."short_urls" USING "btree" ("target_url");



CREATE OR REPLACE TRIGGER "rotations_checksum_trigger" BEFORE INSERT OR UPDATE ON "public"."rotations" FOR EACH ROW EXECUTE FUNCTION "public"."update_rotation_checksum"();



CREATE OR REPLACE TRIGGER "rotations_updated_at" BEFORE UPDATE ON "public"."rotations" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_columns"();



CREATE OR REPLACE TRIGGER "rotations_version_trigger" BEFORE INSERT OR UPDATE ON "public"."rotations" FOR EACH ROW EXECUTE FUNCTION "public"."create_rotation_version"();



CREATE OR REPLACE TRIGGER "trg_pending_chunk" AFTER INSERT OR UPDATE ON "public"."jobs_chunks" FOR EACH ROW EXECUTE FUNCTION "public"."notify_pending_chunk"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_columns"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_columns"();



CREATE OR REPLACE TRIGGER "user_profiles_check_handle" BEFORE INSERT OR UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."check_handle_not_reserved"();



CREATE OR REPLACE TRIGGER "user_profiles_prevent_handle_change" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_handle_change"();



ALTER TABLE ONLY "public"."jobs_chunks"
    ADD CONSTRAINT "jobs_chunks_config_hash_fkey" FOREIGN KEY ("config_hash") REFERENCES "public"."jobs_configs"("hash");



ALTER TABLE ONLY "public"."jobs_chunks"
    ADD CONSTRAINT "jobs_chunks_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs_chunks"
    ADD CONSTRAINT "jobs_chunks_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_config_hash_fkey" FOREIGN KEY ("config_hash") REFERENCES "public"."jobs_configs"("hash");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."nodes_permissions"
    ADD CONSTRAINT "nodes_permissions_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nodes"
    ADD CONSTRAINT "nodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rotations"
    ADD CONSTRAINT "rotations_forked_from_id_fkey" FOREIGN KEY ("forked_from_id") REFERENCES "public"."rotations"("id");



ALTER TABLE ONLY "public"."rotations"
    ADD CONSTRAINT "rotations_spec_id_fkey" FOREIGN KEY ("spec_id") REFERENCES "game"."specs"("id");



ALTER TABLE ONLY "public"."rotations"
    ADD CONSTRAINT "rotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."rotations_versions"
    ADD CONSTRAINT "rotations_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rotations_versions"
    ADD CONSTRAINT "rotations_versions_rotation_id_fkey" FOREIGN KEY ("rotation_id") REFERENCES "public"."rotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read access" ON "game"."classes" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "game"."global_colors" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "game"."global_strings" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "game"."auras" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "game"."items" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "game"."specs" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "game"."specs_traits" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "game"."spells" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "game"."curve_points" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "game"."curves" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "game"."item_bonuses" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "game"."rand_prop_points" FOR SELECT USING (true);



ALTER TABLE "game"."auras" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."curve_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."curves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."global_colors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."global_strings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."item_bonuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."rand_prop_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."specs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."specs_traits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "game"."spells" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anyone_can_read" ON "public"."short_urls" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "anyone_can_read" ON "public"."sim_profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "authenticated_insert_configs" ON "public"."jobs_configs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "authenticated_update_configs" ON "public"."jobs_configs" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "node_owners_update_chunks" ON "public"."jobs_chunks" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."nodes"
  WHERE (("nodes"."id" = "jobs_chunks"."node_id") AND ("nodes"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."nodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nodes_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "nodes_permissions_owner_all" ON "public"."nodes_permissions" USING ((EXISTS ( SELECT 1
   FROM "public"."nodes"
  WHERE (("nodes"."id" = "nodes_permissions"."node_id") AND ("nodes"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "public_read_configs" ON "public"."jobs_configs" FOR SELECT USING (true);



ALTER TABLE "public"."rotations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rotations_delete_own" ON "public"."rotations" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "rotations_insert_own" ON "public"."rotations" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "rotations_select_public_or_own" ON "public"."rotations" FOR SELECT USING ((("is_public" = true) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "rotations_update_own" ON "public"."rotations" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."rotations_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_can_write" ON "public"."short_urls" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_write" ON "public"."sim_profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_full_access" ON "public"."jobs_configs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_only" ON "public"."user_reserved_handles" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."short_urls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sim_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_reserved_handles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_delete_own_nodes" ON "public"."nodes" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_insert_configs" ON "public"."jobs_configs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "users_insert_own_chunks" ON "public"."jobs_chunks" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."jobs"
  WHERE (("jobs"."id" = "jobs_chunks"."job_id") AND ("jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "users_insert_own_rotation_history" ON "public"."rotations_versions" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_manage_own_jobs" ON "public"."jobs" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_read_own_chunks" ON "public"."jobs_chunks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."jobs"
  WHERE (("jobs"."id" = "jobs_chunks"."job_id") AND ("jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "users_read_own_configs" ON "public"."jobs_configs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."jobs"
  WHERE (("jobs"."config_hash" = "jobs_configs"."hash") AND ("jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "users_read_own_nodes" ON "public"."nodes" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_read_own_profile" ON "public"."user_profiles" FOR SELECT USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_read_own_rotation_history" ON "public"."rotations_versions" FOR SELECT TO "authenticated" USING (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_read_own_settings" ON "public"."user_settings" FOR SELECT USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_update_own_nodes" ON "public"."nodes" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_update_own_profile" ON "public"."user_profiles" FOR UPDATE USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_update_own_settings" ON "public"."user_settings" FOR UPDATE USING (("id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



GRANT USAGE ON SCHEMA "game" TO "anon";
GRANT USAGE ON SCHEMA "game" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."check_handle_not_reserved"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_handle_not_reserved"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_handle_not_reserved"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_job"("p_config" "jsonb", "p_iterations" integer, "p_access_type" "text", "p_discord_server_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_job"("p_config" "jsonb", "p_iterations" integer, "p_access_type" "text", "p_discord_server_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_job"("p_config" "jsonb", "p_iterations" integer, "p_access_type" "text", "p_discord_server_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_job"("p_config_hash" "text", "p_iterations" integer, "p_access_type" "text", "p_discord_server_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_job"("p_config_hash" "text", "p_iterations" integer, "p_access_type" "text", "p_discord_server_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_job"("p_config_hash" "text", "p_iterations" integer, "p_access_type" "text", "p_discord_server_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_rotation_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_rotation_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_rotation_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_own_account"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_own_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_own_account"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_default_handle"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_default_handle"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_default_handle"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_random_seed"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_random_seed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_random_seed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_short_url"("p_target_url" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_short_url"("p_target_url" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_short_url"("p_target_url" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_friendship_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_friendship_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_friendship_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_guild_member_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_guild_member_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_guild_member_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_node_visibility_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_node_visibility_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_node_visibility_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_node_visibility_config_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_node_visibility_config_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_node_visibility_config_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_pending_chunk"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_pending_chunk"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_pending_chunk"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_handle_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_handle_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_handle_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_rotation_checksum"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_rotation_checksum"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_rotation_checksum"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp_columns"() TO "service_role";












SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;









GRANT ALL ON TABLE "game"."auras" TO "anon";
GRANT ALL ON TABLE "game"."auras" TO "authenticated";
GRANT ALL ON TABLE "game"."auras" TO "service_role";



GRANT SELECT ON TABLE "game"."classes" TO "anon";
GRANT SELECT ON TABLE "game"."classes" TO "authenticated";



GRANT SELECT ON TABLE "game"."curve_points" TO "anon";
GRANT SELECT ON TABLE "game"."curve_points" TO "authenticated";



GRANT SELECT ON TABLE "game"."curves" TO "anon";
GRANT SELECT ON TABLE "game"."curves" TO "authenticated";



GRANT SELECT ON TABLE "game"."global_colors" TO "anon";
GRANT SELECT ON TABLE "game"."global_colors" TO "authenticated";



GRANT SELECT ON TABLE "game"."global_strings" TO "anon";
GRANT SELECT ON TABLE "game"."global_strings" TO "authenticated";



GRANT SELECT ON TABLE "game"."item_bonuses" TO "anon";
GRANT SELECT ON TABLE "game"."item_bonuses" TO "authenticated";



GRANT ALL ON TABLE "game"."items" TO "anon";
GRANT ALL ON TABLE "game"."items" TO "authenticated";
GRANT ALL ON TABLE "game"."items" TO "service_role";



GRANT SELECT ON TABLE "game"."rand_prop_points" TO "anon";
GRANT SELECT ON TABLE "game"."rand_prop_points" TO "authenticated";



GRANT ALL ON TABLE "game"."specs" TO "anon";
GRANT ALL ON TABLE "game"."specs" TO "authenticated";
GRANT ALL ON TABLE "game"."specs" TO "service_role";



GRANT ALL ON TABLE "game"."specs_traits" TO "anon";
GRANT ALL ON TABLE "game"."specs_traits" TO "authenticated";
GRANT ALL ON TABLE "game"."specs_traits" TO "service_role";



GRANT ALL ON TABLE "game"."spells" TO "anon";
GRANT ALL ON TABLE "game"."spells" TO "authenticated";
GRANT ALL ON TABLE "game"."spells" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."jobs_chunks" TO "anon";
GRANT ALL ON TABLE "public"."jobs_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."jobs_configs" TO "anon";
GRANT ALL ON TABLE "public"."jobs_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs_configs" TO "service_role";



GRANT ALL ON TABLE "public"."nodes" TO "anon";
GRANT ALL ON TABLE "public"."nodes" TO "authenticated";
GRANT ALL ON TABLE "public"."nodes" TO "service_role";



GRANT ALL ON TABLE "public"."nodes_permissions" TO "anon";
GRANT ALL ON TABLE "public"."nodes_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."nodes_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."rotations" TO "anon";
GRANT ALL ON TABLE "public"."rotations" TO "authenticated";
GRANT ALL ON TABLE "public"."rotations" TO "service_role";



GRANT ALL ON TABLE "public"."rotations_versions" TO "anon";
GRANT ALL ON TABLE "public"."rotations_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."rotations_versions" TO "service_role";



GRANT ALL ON TABLE "public"."short_urls" TO "anon";
GRANT ALL ON TABLE "public"."short_urls" TO "authenticated";
GRANT ALL ON TABLE "public"."short_urls" TO "service_role";



GRANT ALL ON TABLE "public"."sim_profiles" TO "anon";
GRANT ALL ON TABLE "public"."sim_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."sim_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_reserved_handles" TO "anon";
GRANT ALL ON TABLE "public"."user_reserved_handles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reserved_handles" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "anyone_can_read" on "public"."short_urls";

drop policy "anyone_can_read" on "public"."sim_profiles";


  create policy "anyone_can_read"
  on "public"."short_urls"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "anyone_can_read"
  on "public"."sim_profiles"
  as permissive
  for select
  to anon, authenticated
using (true);


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "compiled_rotations_public_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'compiled-rotations'::text));



  create policy "compiled_rotations_service_delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'compiled-rotations'::text));



  create policy "compiled_rotations_service_update"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'compiled-rotations'::text));



  create policy "compiled_rotations_service_write"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'compiled-rotations'::text));



