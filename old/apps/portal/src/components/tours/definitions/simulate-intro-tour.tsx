"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

function getSteps(hasRecentCharacters: boolean): Step[] {
  const steps: Step[] = [
    {
      target: '[data-tour="simc-input"]',
      content: "Paste a SimulationCraft export from the addon.",
      title: "Paste a profile",
      placement: "bottom",
      disableBeacon: true,
    },
  ];

  if (hasRecentCharacters) {
    steps.push({
      target: '[data-tour="recent-characters"]',
      content: "Switch between profiles you imported recently.",
      title: "Recent profiles",
      placement: "bottom",
    });
  }

  return steps;
}

export function SimulateIntroTour({
  show,
  hasRecentCharacters,
}: {
  show: boolean;
  hasRecentCharacters: boolean;
}) {
  if (!show) {
    return null;
  }

  const tour: TourConfig = {
    id: "simulate-intro",
    steps: getSteps(hasRecentCharacters),
  };

  return <TourRunner tour={tour} run={show} />;
}
