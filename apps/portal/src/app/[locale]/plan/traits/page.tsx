import { TraitsContent } from "@/components/plan/traits";
import { extractSpecId } from "@/lib/trait";

interface Props {
  searchParams: Promise<{ loadout?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { loadout } = await searchParams;

  if (!loadout) {
    return <TraitsContent type="start" />;
  }

  const specId = extractSpecId(loadout);

  if (!specId) {
    return <TraitsContent type="invalid" />;
  }

  return <TraitsContent type="calculator" specId={specId} />;
}
