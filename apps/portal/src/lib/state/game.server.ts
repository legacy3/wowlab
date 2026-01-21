import type { SpecTraits } from "@/lib/supabase/types";

import { createClient } from "@/lib/supabase/server";

import { gameKeys } from "./query-keys";

export { gameKeys };

export async function fetchSpecTraits(specId: number): Promise<SpecTraits> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("game")
    .from("specs_traits")
    .select("*")
    .eq("spec_id", specId)
    .single();

  if (error) throw error;
  return data as SpecTraits;
}

export const specTraitsQueryOptions = (specId: number) => ({
  queryFn: () => fetchSpecTraits(specId),
  queryKey: gameKeys.specTraits(specId),
});
