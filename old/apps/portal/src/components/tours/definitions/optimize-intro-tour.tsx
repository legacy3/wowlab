"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="optimization-status"]',
    content:
      "Optimization runs aren't wired up yet. This page is a preview of the planned dashboard.",
    title: "Optimize (WIP)",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="current-gear"]',
    content: "This card will show your equipped items and their contribution.",
    title: "Current gear",
    placement: "bottom",
  },
  {
    target: '[data-tour="upgrade-path"]',
    content: "This list will rank upgrades by estimated DPS gain.",
    title: "Upgrade path",
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
