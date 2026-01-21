import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import {
  InvalidLoadoutError,
  TraitCalculator,
  TraitStartScreen,
} from "@/components/plan/traits";
import { fetchSpecTraits, gameKeys } from "@/lib/state/game.server";
import { extractSpecId } from "@/lib/trait";

interface Props {
  searchParams: Promise<{ loadout?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { loadout } = await searchParams;

  if (!loadout) {
    return <TraitStartScreen />;
  }

  const specId = extractSpecId(loadout);

  if (!specId) {
    return <InvalidLoadoutError />;
  }

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryFn: () => fetchSpecTraits(specId),
    queryKey: gameKeys.specTraits(specId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TraitCalculator specId={specId} />
    </HydrationBoundary>
  );
}
