"use client";

import { WasmProvider } from "@/providers";

import { SimulateWizard } from "./simulate-wizard";

export function SimulateContent() {
  return (
    <WasmProvider>
      <SimulateWizard />
    </WasmProvider>
  );
}
