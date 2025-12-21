"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="rotations-search"]',
    content: "Search by name or description.",
    title: "Search rotations",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="rotations-filters"]',
    content: "Filter the list by class.",
    title: "Filter by class",
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
