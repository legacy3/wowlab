import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import { createClient } from "@/lib/supabase/client";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient();
  }

  return client;
}

export function createDataProvider() {
  return supabaseDataProvider(getSupabaseClient());
}
