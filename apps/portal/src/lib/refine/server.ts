import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";

import { createClient } from "@/lib/supabase/server";

/**
 * Create a server-side Refine data provider instance.
 * Use this in Server Components for SSR data fetching.
 *
 * @example
 * ```tsx
 * export default async function Page({ params }: Props) {
 *   const dataProvider = await getServerDataProvider();
 *   const { data } = await dataProvider.getOne({
 *     resource: "specs_traits",
 *     id: params.specId,
 *     meta: { schema: "game", idColumnName: "spec_id" },
 *   });
 *
 *   return <ClientComponent initialData={data} />;
 * }
 * ```
 */
export async function getServerDataProvider() {
  const supabase = await createClient();
  return supabaseDataProvider(supabase);
}
