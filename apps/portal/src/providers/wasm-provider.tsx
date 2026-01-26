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

/**
 * Get the initialized common module.
 * Must be used within a WasmProvider (which must be inside a Suspense boundary).
 */
export function useCommon(): CommonModule {
  return useWasmContext().common;
}

/**
 * Get the initialized engine module.
 * Must be used within a WasmProvider (which must be inside a Suspense boundary).
 */
export function useEngine(): EngineModule {
  return useWasmContext().engine;
}

/**
 * Provider that initializes both WASM modules using Suspense.
 * Wrap your app with this inside a Suspense boundary.
 *
 * @example
 * ```tsx
 * <Suspense fallback={<Loading />}>
 *   <WasmProvider>
 *     <App />
 *   </WasmProvider>
 * </Suspense>
 * ```
 */
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
