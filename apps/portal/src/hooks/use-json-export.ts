"use client";

import { useCallback, useMemo, useRef } from "react";

export function useJsonExport<T>({
  data,
  filenamePrefix,
  filenameTag,
  patchVersion,
}: {
  data: T | null | undefined;
  filenamePrefix: string;
  filenameTag?: string;
  patchVersion: string;
}) {
  const exportedAtRef = useRef<string | null>(null);

  const exportedAt = useMemo(() => {
    if (!data) {
      exportedAtRef.current = null;
      return null;
    }

    if (!exportedAtRef.current) {
      exportedAtRef.current = new Date().toISOString();
    }

    return exportedAtRef.current;
  }, [data]);

  const exportJson = useMemo(() => {
    if (!data || !exportedAt) {
      return null;
    }

    return JSON.stringify(
      {
        data,
        exportedAt,
        patchVersion,
      },
      null,
      2,
    );
  }, [data, exportedAt, patchVersion]);

  const downloadJson = useCallback(() => {
    if (!exportJson) {
      return;
    }

    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const tag = filenameTag ? `-${filenameTag}` : "";
    link.download = `${filenamePrefix}-${patchVersion}${tag}-${Date.now()}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }, [exportJson, filenamePrefix, filenameTag, patchVersion]);

  return { downloadJson, exportJson };
}
