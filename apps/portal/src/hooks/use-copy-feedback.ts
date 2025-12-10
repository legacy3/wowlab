"use client";

import { useState, useCallback } from "react";

interface UseCopyFeedbackOptions {
  duration?: number;
}

interface UseCopyFeedbackReturn {
  copied: boolean;
  copy: (text: string) => void;
}

export function useCopyFeedback(
  options: UseCopyFeedbackOptions = {},
): UseCopyFeedbackReturn {
  const { duration = 1500 } = options;
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), duration);
    },
    [duration],
  );

  return { copied, copy };
}
