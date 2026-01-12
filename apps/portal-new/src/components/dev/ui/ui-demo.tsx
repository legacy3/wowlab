"use client";

import { ImportPath, PageLayout } from "../shared";
import {
  ActionsSection,
  DataDisplaySection,
  FeedbackSection,
  FormsSection,
  NavigationSection,
  OverlaysSection,
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
  { id: "spec-picker", label: "Spec Picker" },
  { id: "tokens", label: "Tokens" },
];

export function UiDemo() {
  return (
    <PageLayout
      title="UI Components"
      description={<ImportPath path="@/components/ui" />}
      nav={NAV}
    >
      <FormsSection />
      <OverlaysSection />
      <NavigationSection />
      <FeedbackSection />
      <DataDisplaySection />
      <ActionsSection />
      <SpecPickerSection />
      <TokensSection />
    </PageLayout>
  );
}
