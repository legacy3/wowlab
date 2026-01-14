"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="rotation-editor-code"]',
    title: "Write a priority list",
    content:
      "Write a spell priority list in JavaScript. The sim handles GCDs, cooldowns, and timing.",
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[data-tour="rotation-editor-sidebar"]',
    title: "Use the sidebar",
    content:
      "Browse spells, copy snippets, and insert helpers into your script.",
    placement: "left",
  },
  {
    target: '[data-tour="rotation-editor-save"]',
    title: "Save your work",
    content: "Create the rotation, or save changes as you iterate.",
    placement: "top",
  },
  {
    target: '[data-tour="rotation-editor-settings"]',
    title: "Settings",
    content:
      "Update metadata, toggle public visibility, or delete an existing rotation.",
    placement: "bottom",
  },
  {
    target: '[data-tour="rotation-editor-zen"]',
    title: "Zen Mode",
    content: "Go fullscreen while you write (press ESC to exit).",
    placement: "bottom",
  },
  {
    target: '[data-tour="rotation-editor-test"]',
    title: "Test (WIP)",
    content: "The test runner isn't wired up yet.",
    placement: "top",
  },
];

const tour: TourConfig = {
  id: "rotation-editor",
  steps,
};

export function RotationEditorTour({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return <TourRunner tour={tour} run={show} />;
}
