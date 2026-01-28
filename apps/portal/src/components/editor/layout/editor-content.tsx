"use client";

import { WasmProvider } from "@/providers";

import { EditorPage } from "./editor-page";

export function EditorContent() {
  return (
    <WasmProvider>
      <EditorPage />
    </WasmProvider>
  );
}
