"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="talent-import-input"]',
    content:
      "Paste a talent string from Wowhead, Raidbots, or copy it directly from the game to load your build.",
    title: "Import Your Talents",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="spec-picker"]',
    content:
      "Or select a class and specialization to start building from scratch.",
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
