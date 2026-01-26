"use client";

import { Suspense } from "react";
import { Flex } from "styled-system/jsx";

import { Loader } from "@/components/ui";
import { WasmProvider } from "@/providers";

import { EditorPage } from "./editor-page";

export function EditorContent() {
  return (
    <Suspense fallback={<LoadingState />}>
      <WasmProvider>
        <EditorPage />
      </WasmProvider>
    </Suspense>
  );
}

function LoadingState() {
  return (
    <Flex align="center" justify="center" minH="400px">
      <Loader size="lg" />
    </Flex>
  );
}
