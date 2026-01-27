"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { createContext, use } from "react";

import { WasmError } from "@/components/common";
import { getCommon, getEngine } from "@/lib/wasm/loaders";

type CommonModule = Awaited<ReturnType<typeof getCommon>>;
type EngineModule = Awaited<ReturnType<typeof getEngine>>;

interface WasmContextValue {
  common: CommonModule;
  engine: EngineModule;
}

const WasmContext = createContext<WasmContextValue | null>(null);

const wasmQueryKeys = {
  common: ["wasm", "common"] as const,
  engine: ["wasm", "engine"] as const,
};

interface WasmProviderProps {
  children: React.ReactNode;
}

export function useCommon(): CommonModule {
  return useWasmContext().common;
}

export function useEngine(): EngineModule {
  return useWasmContext().engine;
}

export function WasmProvider({ children }: WasmProviderProps) {
  if (!isWasmSupported()) {
    return <WasmError />;
  }

  return <WasmLoader>{children}</WasmLoader>;
}

function isWasmSupported(): boolean {
  try {
    if (typeof WebAssembly !== "object") return false;
    const wasmModule = new WebAssembly.Module(
      new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]),
    );

    return wasmModule instanceof WebAssembly.Module;
  } catch {
    return false;
  }
}

function useWasmContext(): WasmContextValue {
  const context = use(WasmContext);
  if (!context) {
    throw new Error("useWasmContext must be used within a WasmProvider");
  }

  return context;
}

function WasmLoader({ children }: { children: React.ReactNode }) {
  const { data: engine } = useSuspenseQuery({
    queryFn: getEngine,
    queryKey: wasmQueryKeys.engine,
    staleTime: Infinity,
  });

  const { data: common } = useSuspenseQuery({
    queryFn: getCommon,
    queryKey: wasmQueryKeys.common,
    staleTime: Infinity,
  });

  return <WasmContext value={{ common, engine }}>{children}</WasmContext>;
}
