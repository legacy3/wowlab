"use client";

import { PageLayout } from "../shared";
import {
  ActionsSection,
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
  { id: "forms", label: "Forms" },
  { id: "overlays", label: "Overlays" },
  { id: "navigation", label: "Navigation" },
  { id: "feedback", label: "Feedback" },
  { id: "data-display", label: "Data Display" },
  { id: "actions", label: "Actions" },
  { id: "simulate", label: "Simulate" },
  { id: "spec-picker", label: "Spec Picker" },
  { id: "i18n", label: "i18n" },
  { id: "tokens", label: "Tokens" },
];

export function UiDemo() {
  return (
    <PageLayout nav={NAV}>
      <FormsSection />
      <OverlaysSection />
      <NavigationSection />
      <FeedbackSection />
      <DataDisplaySection />
      <ActionsSection />
      <SimulateSection />
      <SpecPickerSection />
      <I18nSection />
      <TokensSection />
    </PageLayout>
  );
}
