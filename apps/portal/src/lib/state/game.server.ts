import type { SpecTraits } from "@/lib/supabase/types";

import { getServerDataProvider } from "@/lib/refine/server";

/**
 * Fetch spec traits on the server using Refine's data provider.
 * This ensures consistency with client-side Refine hooks.
 */
export async function fetchSpecTraits(specId: number): Promise<SpecTraits> {
  const dataProvider = await getServerDataProvider();
  const { data } = await dataProvider.getOne<SpecTraits>({
    id: specId,
    meta: { idColumnName: "spec_id", schema: "game" },
    resource: "specs_traits",
  });
  return data;
}
