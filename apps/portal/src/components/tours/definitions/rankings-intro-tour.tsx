"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="rankings-tabs"]',
    title: "Explore Rankings",
    content:
      "Switch between spec rankings, top talents, most wanted items, and top sims.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="rankings-tier"]',
    title: "Raid Tier",
    content: "Pick the tier you want to compare.",
    placement: "bottom",
  },
  {
    target: '[data-tour="rankings-fight-length"]',
    title: "Fight Length",
    content: "Filter rankings by encounter length.",
    placement: "bottom",
  },
  {
    target: '[data-tour="rankings-time-window"]',
    title: "Time Window",
    content: "Choose how recent the data should be.",
    placement: "bottom",
  },
  {
    target: '[data-tour="rankings-results"]',
    title: "Results",
    content: "Use the table to spot top performers and trends.",
    placement: "top",
  },
];

const tour: TourConfig = {
  id: "rankings-intro",
  steps,
};

export function RankingsIntroTour({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return <TourRunner tour={tour} run={show} />;
}
