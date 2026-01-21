import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Container } from "styled-system/jsx";

import {
  TalentCalculatorContent,
  TalentStartScreen,
} from "@/components/plan/talents";
import { Button } from "@/components/ui/button";
import * as Empty from "@/components/ui/empty";
import { Link } from "@/components/ui/link";
import { routes } from "@/lib/routing";
import { fetchSpecTraits, gameKeys } from "@/lib/state/game.server";
import { extractSpecId } from "@/lib/trait";

interface Props {
  searchParams: Promise<{ loadout?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { loadout } = await searchParams;

  if (!loadout) {
    return <TalentStartScreen />;
  }

  const specId = extractSpecId(loadout);

  if (!specId) {
    return (
      <Container maxW="7xl" py="8">
        <Empty.Root>
          <Empty.Icon>
            <AlertTriangle />
          </Empty.Icon>
          <Empty.Content>
            <Empty.Title>Invalid loadout string</Empty.Title>
            <Empty.Description>
              The provided loadout string could not be decoded.
            </Empty.Description>
          </Empty.Content>
          <Empty.Action>
            <Button asChild>
              <Link href={routes.plan.talents.path}>Back to start</Link>
            </Button>
          </Empty.Action>
        </Empty.Root>
      </Container>
    );
  }

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryFn: () => fetchSpecTraits(specId),
    queryKey: gameKeys.specTraits(specId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TalentCalculatorContent specId={specId} />
    </HydrationBoundary>
  );
}
