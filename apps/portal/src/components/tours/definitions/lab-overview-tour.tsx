"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="data-inspector"]',
    content: "Look up spells, items, and other game data by ID or name.",
    title: "Data Inspector",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="spec-coverage"]',
    content:
      "Check what each spec supports before you spend time simming or writing rotations.",
    title: "Spec coverage",
    placement: "bottom",
  },
];

const tour: TourConfig = {
  id: "lab-overview",
  steps,
};

export function LabOverviewTour({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return <TourRunner tour={tour} run={show} />;
}
