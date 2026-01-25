import {
  InvalidLoadoutError,
  TraitCalculator,
  TraitStartScreen,
} from "@/components/plan/traits";
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

  // TraitCalculator uses useResource + specsTraits internally
  // Data fetching happens on the client via Refine hooks
  return <TraitCalculator specId={specId} />;
}
