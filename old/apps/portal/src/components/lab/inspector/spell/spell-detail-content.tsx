"use client";

import { useAtom } from "jotai";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import { spellDetailOrderAtom, type SpellDetailCardId } from "@/atoms/lab";
import {
  HeaderCard,
  QuickStatsCard,
  EffectsCard,
  ProcMechanicsCard,
  ScalingCard,
  AttributesCard,
  SpellClassCard,
  AuraRestrictionsCard,
  ShapeshiftCard,
  LabelsCard,
  EmpowerCard,
  RelatedSpellsCard,
  RawDataCard,
  SimulationNotesCard,
} from "./cards";

const components: DashboardConfig<SpellDetailCardId> = {
  header: { Component: HeaderCard, className: "md:col-span-2" },
  "quick-stats": { Component: QuickStatsCard, className: "md:col-span-2" },
  effects: { Component: EffectsCard },
  "proc-mechanics": { Component: ProcMechanicsCard },
  scaling: { Component: ScalingCard },
  attributes: { Component: AttributesCard },
  "spell-class": { Component: SpellClassCard },
  "aura-restrictions": { Component: AuraRestrictionsCard },
  shapeshift: { Component: ShapeshiftCard },
  labels: { Component: LabelsCard },
  empower: { Component: EmpowerCard },
  "related-spells": {
    Component: RelatedSpellsCard,
    className: "md:col-span-2",
  },
  "raw-data": { Component: RawDataCard },
  "simulation-notes": { Component: SimulationNotesCard },
};

export function SpellDetailContent() {
  const [order, setOrder] = useAtom(spellDetailOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4 md:grid-cols-2"
    />
  );
}
