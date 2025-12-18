"use client";

import { useState, useCallback } from "react";
import { serializeError } from "serialize-error";

export function useSerializedError() {
  const [error, setError] = useState<string | null>(null);

  const setSerializedError = useCallback((err: unknown) => {
    setError(JSON.stringify(serializeError(err), null, 2));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, setSerializedError, clearError };
}
