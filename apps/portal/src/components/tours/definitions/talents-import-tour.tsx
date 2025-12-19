"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="talent-import-input"]',
    content:
      "Paste a talent string from Wowhead, Raidbots, or export it from the game.",
    title: "Import Talents",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="spec-picker"]',
    content: "Or pick a spec to start with a blank tree.",
    title: "Start Fresh",
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
