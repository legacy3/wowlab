"use client";

import { itemDetailOrderAtom, type ItemDetailCardId } from "@/atoms/lab";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import { useAtom } from "jotai";
import {
  ArmorCalculationCard,
  BonusIdsCard,
  ClassificationCard,
  CraftingCard,
  DropSourcesCard,
  HeaderCard,
  ItemEffectsCard,
  ItemFlagsCard,
  RawDataCard,
  SetBonusesCard,
  SimulationCard,
  SocketsCard,
  SpecUsabilityCard,
  StatBreakdownCard,
  UpgradePathCard,
} from "./cards";

const components: DashboardConfig<ItemDetailCardId> = {
  header: { Component: HeaderCard, className: "md:col-span-2" },
  classification: { Component: ClassificationCard },
  "stat-breakdown": { Component: StatBreakdownCard },
  "bonus-ids": { Component: BonusIdsCard, className: "md:col-span-2" },
  "upgrade-path": { Component: UpgradePathCard, className: "md:col-span-2" },
  sockets: { Component: SocketsCard },
  "set-bonuses": { Component: SetBonusesCard },
  "item-effects": { Component: ItemEffectsCard, className: "md:col-span-2" },
  "armor-calculation": { Component: ArmorCalculationCard },
  "spec-usability": { Component: SpecUsabilityCard },
  "drop-sources": { Component: DropSourcesCard, className: "md:col-span-2" },
  "item-flags": { Component: ItemFlagsCard },
  crafting: { Component: CraftingCard },
  "raw-data": { Component: RawDataCard },
  simulation: { Component: SimulationCard },
};

export function ItemDetailContent() {
  const [order, setOrder] = useAtom(itemDetailOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4 md:grid-cols-2"
    />
  );
}
