"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

export function useJsonExport<TData, TPayload = unknown>({
  data,
  filenamePrefix,
  filenameTag,
  patchVersion,
  buildPayload,
  resetKey,
}: {
  data: TData | null | undefined;
  filenamePrefix: string;
  filenameTag?: string;
  patchVersion: string;
  buildPayload?: (args: {
    data: TData;
    exportedAt: string;
    patchVersion: string;
  }) => TPayload;
  resetKey?: string | number | null;
}) {
  const exportedAtRef = useRef<string | null>(null);

  useEffect(() => {
    exportedAtRef.current = null;
  }, [resetKey]);

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

    const payload =
      buildPayload?.({ data, exportedAt, patchVersion }) ??
      ({
        data,
        exportedAt,
        patchVersion,
      } as unknown as TPayload);

    return JSON.stringify(payload, null, 2);
  }, [buildPayload, data, exportedAt, patchVersion]);

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
