"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useSpecCoverage,
  calculateCoverage,
  getCounts,
  getOverallStats,
  type SpecCoverageData,
  type SpecCoverageClass,
  type SpecCoverageSpell,
} from "@/hooks/use-spec-coverage";

// TODO Check why we need context.tsx and content.tsx

interface SpecCoverageContextValue {
  data: SpecCoverageData | null;
  loading: boolean;
  error: string | null;
  calculateCoverage: typeof calculateCoverage;
  getCounts: typeof getCounts;
  getOverallStats: () => ReturnType<typeof getOverallStats> | null;
}

const SpecCoverageContext = createContext<SpecCoverageContextValue | null>(
  null,
);

export function SpecCoverageProvider({ children }: { children: ReactNode }) {
  const { data, loading, error } = useSpecCoverage();

  const value: SpecCoverageContextValue = {
    data,
    loading,
    error,
    calculateCoverage,
    getCounts,
    getOverallStats: () => (data ? getOverallStats(data) : null),
  };

  return (
    <SpecCoverageContext.Provider value={value}>
      {children}
    </SpecCoverageContext.Provider>
  );
}

export function useSpecCoverageContext() {
  const context = useContext(SpecCoverageContext);
  if (!context) {
    throw new Error(
      "useSpecCoverageContext must be used within a SpecCoverageProvider",
    );
  }

  return context;
}

// TODO Remove this stupid re-export
export type { SpecCoverageData, SpecCoverageClass, SpecCoverageSpell };
