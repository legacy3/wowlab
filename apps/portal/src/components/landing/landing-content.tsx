"use client";

import { useAtom } from "jotai";
import {
  Calculator,
  TrendingUp,
  Trophy,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import { landingOrderAtom, type LandingCardId } from "@/atoms/landing";
import { LandingCard } from "./cards/landing-card";
import { RecentCard } from "./cards/recent-card";
import { QuickSimCard } from "./cards/quick-sim-card";

const TalentsCard = () => (
  <LandingCard
    href="/talents"
    icon={Calculator}
    title="Talents"
    description="Build talents"
    content="Interactive talent tree builder with import/export."
  />
);

const OptimizeCard = () => (
  <LandingCard
    href="/optimize"
    icon={TrendingUp}
    title="Optimize"
    description="Find gear upgrades"
    content="Discover the best upgrades for any equipment slot."
  />
);

const RankingsCard = () => (
  <LandingCard
    href="/rankings"
    icon={Trophy}
    title="Rankings"
    description="Top performers"
    content="See top performing specs and community rotations."
  />
);

const RotationsCard = () => (
  <LandingCard
    href="/rotations"
    icon={BookOpen}
    title="Rotations"
    description="Browse scripts"
    content="Explore community rotation scripts for all specs."
  />
);

const LabCard = () => (
  <LandingCard
    href="/lab"
    icon={FlaskConical}
    title="Lab"
    description="Experimental tools"
    content="Data inspection, spec coverage, and more."
  />
);

const components: DashboardConfig<LandingCardId> = {
  recent: { Component: RecentCard, className: "sm:col-span-2" },
  "quick-sim": { Component: QuickSimCard, className: "sm:col-span-2" },
  talents: { Component: TalentsCard },
  optimize: { Component: OptimizeCard },
  rankings: { Component: RankingsCard },
  rotations: { Component: RotationsCard },
  lab: { Component: LabCard, className: "sm:col-span-2" },
};

export function LandingContent() {
  const [order, setOrder] = useAtom(landingOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    />
  );
}
