"use client";

import type { Step } from "react-joyride";
import { TourRunner, type TourConfig } from "../tour-provider";

const steps: Step[] = [
  {
    target: '[data-tour="rotation-editor-code"]',
    title: "Write Your Rotation",
    content:
      "This is your rotation script. Use TypeScript + Effect helpers to model priority, cooldowns, and decision making.",
    placement: "left",
    disableBeacon: true,
  },
  {
    target: '[data-tour="rotation-editor-sidebar"]',
    title: "Sidebar Tools",
    content:
      "Browse spells, copy snippets, and insert API helpers directly into your script.",
    placement: "left",
  },
  {
    target: '[data-tour="rotation-editor-save"]',
    title: "Save",
    content: "Create your rotation (or save changes) at any time.",
    placement: "top",
  },
  {
    target: '[data-tour="rotation-editor-test"]',
    title: "Test",
    content:
      "Run a quick test to validate your script and catch errors before publishing.",
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
