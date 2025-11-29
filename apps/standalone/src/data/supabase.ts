import { createClient } from "@supabase/supabase-js";

import { DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL } from "../config.js";

// Allow environment variable overrides
const SUPABASE_URL = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
