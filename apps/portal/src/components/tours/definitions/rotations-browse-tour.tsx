"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="rotations-search"]',
    content: "Search rotations by name or description.",
    title: "Search",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="rotations-filters"]',
    content: "Narrow down by class.",
    title: "Filters",
    placement: "bottom",
  },
];

const tour: TourConfig = {
  id: "rotations-browse",
  steps,
};

export function RotationsBrowseTour({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return <TourRunner tour={tour} run={show} />;
}
