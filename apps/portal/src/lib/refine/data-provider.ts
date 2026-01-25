import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";

import { createClient } from "@/lib/supabase/client";

// Lazy-initialize the provider to avoid SSR issues
// The browser client is created only when first accessed on the client
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

// Proxy to the lazy-initialized data provider
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
