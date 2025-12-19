"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="current-gear"]',
    content: "Your equipped items and how much DPS each contributes.",
    title: "Current Gear",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="upgrade-path"]',
    content: "Prioritized list of upgrades with the biggest DPS gains first.",
    title: "Upgrade Path",
    placement: "top",
  },
];

const tour: TourConfig = {
  id: "optimize-intro",
  steps,
};

export function OptimizeIntroTour({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return <TourRunner tour={tour} run={show} />;
}
