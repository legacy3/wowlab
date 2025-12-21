"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="rankings-tabs"]',
    title: "Explore rankings",
    content: "Use tabs to switch between rankings views.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="rankings-tier"]',
    title: "Raid tier",
    content: "Pick the raid tier you want to compare.",
    placement: "bottom",
  },
  {
    target: '[data-tour="rankings-fight-length"]',
    title: "Fight length",
    content: "Filter by encounter length.",
    placement: "bottom",
  },
  {
    target: '[data-tour="rankings-time-window"]',
    title: "Time window",
    content: "Choose how recent the data should be.",
    placement: "bottom",
  },
  {
    target: '[data-tour="rankings-results"]',
    title: "Results",
    content: "Use the table to compare specs at a glance.",
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
