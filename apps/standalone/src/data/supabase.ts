import { createClient } from "@supabase/supabase-js";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

const SupabaseConfig = Config.all({
  anonKey: Config.string("SUPABASE_ANON_KEY"),
  url: Config.string("SUPABASE_URL"),
});

export const createSupabaseClient = Effect.gen(function* () {
  const config = yield* SupabaseConfig;
  return createClient(config.url, config.anonKey);
});
