"use client";

import { useAtom } from "jotai";
import {
  PlayCircle,
  TrendingUp,
  Trophy,
  BookOpen,
  Code2,
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

const SimulateCard = () => (
  <LandingCard
    href="/simulate"
    icon={PlayCircle}
    title="Simulate"
    description="Run DPS simulations"
    content="Import your character and test rotation performance."
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

const EditorCard = () => (
  <LandingCard
    href="/rotations/editor"
    icon={Code2}
    title="Editor"
    description="Create rotations"
    content="Build and test your own custom rotation scripts."
  />
);

const LabCard = () => (
  <LandingCard
    href="/lab"
    icon={FlaskConical}
    title="Lab"
    description="Experimental tools"
    content="Data inspection, talent calculator, and more."
  />
);

const components: DashboardConfig<LandingCardId> = {
  recent: { Component: RecentCard, className: "sm:col-span-2" },
  "quick-sim": { Component: QuickSimCard, className: "sm:col-span-2" },
  simulate: { Component: SimulateCard },
  optimize: { Component: OptimizeCard },
  rankings: { Component: RankingsCard },
  rotations: { Component: RotationsCard },
  editor: { Component: EditorCard, className: "sm:col-span-2" },
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
