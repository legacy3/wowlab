"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="talent-import-input"]',
    content: "Paste a talent string from Wowhead, or export one in-game.",
    title: "Import a build",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="spec-picker"]',
    content: "Or pick a spec and start from a blank tree.",
    title: "Start from scratch",
    placement: "top",
  },
];

const tour: TourConfig = {
  id: "talents-import",
  steps,
};

/**
 * Tour for the talents start screen, shown on first visit.
 * Only runs when the start screen is visible (no talents loaded).
 */
export function TalentsImportTour({
  isStartScreen,
}: {
  isStartScreen: boolean;
}) {
  if (!isStartScreen) {
    return null;
  }

  return <TourRunner tour={tour} run={isStartScreen} />;
}
