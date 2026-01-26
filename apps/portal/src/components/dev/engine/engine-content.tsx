"use client";

import { Stack } from "styled-system/jsx";

import { WasmProvider } from "@/providers";

import { PageLayout } from "../shared";
import { SchemaSection, StatusSection, ValidatorSection } from "./sections";

const NAV = [
  { id: "status", label: "Status" },
  { id: "schema", label: "Schema" },
  { id: "validator", label: "Validator" },
];

export function EngineContent() {
  return (
    <WasmProvider>
      <PageLayout nav={NAV}>
        <Stack gap="16">
          <StatusSection />
          <SchemaSection />
          <ValidatorSection />
        </Stack>
      </PageLayout>
    </WasmProvider>
  );
}
