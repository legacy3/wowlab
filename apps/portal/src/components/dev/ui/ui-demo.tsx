"use client";

import { PageLayout } from "../shared";
import {
  ActionsSection,
  ChartsSection,
  DataDisplaySection,
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
  { id: "i18n", label: "i18n" },
];

export function UiDemo() {
  return (
    <PageLayout nav={NAV}>
      {/* Foundation */}
      <TokensSection />
      {/* Core UI */}
      <ActionsSection />
      <FormsSection />
      <DataDisplaySection />
      <ChartsSection />
      <NavigationSection />
      <OverlaysSection />
      <FeedbackSection />
      {/* Domain-specific */}
      <SimulateSection />
      <SpecPickerSection />
      <I18nSection />
    </PageLayout>
  );
}
