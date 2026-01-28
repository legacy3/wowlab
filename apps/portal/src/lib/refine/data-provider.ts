import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";

import { createClient } from "@/lib/supabase/client";

let _supabaseClient: ReturnType<typeof createClient> | null = null;
let _dataProvider: ReturnType<typeof supabaseDataProvider> | null = null;

function getDataProvider() {
  if (!_dataProvider) {
    _dataProvider = supabaseDataProvider(getSupabaseClient());
  }
  return _dataProvider;
}

function getSupabaseClient() {
  if (!_supabaseClient) {
    _supabaseClient = createClient();
  }
  return _supabaseClient;
}

export const dataProvider = new Proxy(
  {} as ReturnType<typeof supabaseDataProvider>,
  {
    get(_, prop) {
      return getDataProvider()[
        prop as keyof ReturnType<typeof supabaseDataProvider>
      ];
    },
  },
);
