"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { createContext, use } from "react";

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

function useWasmContext(): WasmContextValue {
  const context = use(WasmContext);
  if (!context) {
    throw new Error("useWasmContext must be used within a WasmProvider");
  }
  return context;
}
