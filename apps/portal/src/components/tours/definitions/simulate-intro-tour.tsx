"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="simc-input"]',
    content:
      "Paste your SimC string here. You can export it from Raidbots or use the /simc addon in-game.",
    title: "Import Character",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="recent-characters"]',
    content: "Quickly switch between characters you've imported before.",
    title: "Recent Characters",
    placement: "bottom",
  },
];

const tour: TourConfig = {
  id: "simulate-intro",
  steps,
};

export function SimulateIntroTour({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return <TourRunner tour={tour} run={show} />;
}
