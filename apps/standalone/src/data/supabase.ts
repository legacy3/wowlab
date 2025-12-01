import { createClient } from "@supabase/supabase-js";

// Supabase credentials from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
