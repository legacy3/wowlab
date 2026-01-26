"use client";

import { WasmProvider } from "@/providers";

import { PageLayout } from "../shared";
import {
  ActionsSection,
  ChartsSection,
  DataDisplaySection,
  DistributedNodesSection,
  FeedbackSection,
  FormsSection,
  I18nSection,
  NavigationSection,
  OverlaysSection,
  SimulateSection,
  SpecPickerSection,
  TokensSection,
} from "./sections";

const NAV = [
  // Foundation
  { id: "tokens", label: "Tokens" },
  { id: "i18n", label: "i18n" },
  // Core UI
  { id: "actions", label: "Actions" },
  { id: "forms", label: "Forms" },
  { id: "data-display", label: "Data Display" },
  { id: "charts", label: "Charts" },
  { id: "navigation", label: "Navigation" },
  { id: "overlays", label: "Overlays" },
  { id: "feedback", label: "Feedback" },
  // Domain-specific
  { id: "simulate", label: "Simulate" },
  { id: "spec-picker", label: "Spec Picker" },
  { id: "distributed-nodes", label: "Distributed Nodes" },
];

export function UiDemo() {
  return (
    <WasmProvider>
      <PageLayout nav={NAV}>
        <TokensSection />
        <I18nSection />
        <ActionsSection />
        <FormsSection />
        <DataDisplaySection />
        <ChartsSection />
        <NavigationSection />
        <OverlaysSection />
        <FeedbackSection />
        <SimulateSection />
        <SpecPickerSection />
        <DistributedNodesSection />
      </PageLayout>
    </WasmProvider>
  );
}
