"use client";

import { PageLayout } from "../shared";
import {
  RotationSchemaSection,
  StatusSection,
  ValidationSection,
} from "./sections";

const NAV = [
  { id: "status", label: "Status" },
  { id: "rotation-schema", label: "Rotation Schema" },
  { id: "validation", label: "Validation" },
];

export function EngineDemo() {
  return (
    <PageLayout nav={NAV}>
      <StatusSection />
      <RotationSchemaSection />
      <ValidationSection />
    </PageLayout>
  );
}
