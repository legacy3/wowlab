import { useTimeoutEffect } from "@react-hookz/web";
import { useState } from "react";

export interface CopyToClipboardState {
  readonly copied: boolean;
  readonly error: Error | null;
  readonly value?: string;
}

export function useCopyToClipboard(): [
  CopyToClipboardState,
  (value: string) => void,
] {
  const [state, setState] = useState<CopyToClipboardState>({
    copied: false,
    error: null,
    value: undefined,
  });

  const [reset] = useTimeoutEffect(() => {
    setState((prev) => ({ ...prev, copied: false }));
  }, 2000);

  const copyToClipboard = (value: string) => {
    if (!navigator?.clipboard) {
      setState({
        copied: false,
        error: new Error("Clipboard not supported"),
        value: undefined,
      });

      return;
    }

    navigator.clipboard.writeText(value).then(
      () => {
        setState({
          copied: true,
          error: null,
          value,
        });
        reset();
      },
      (error) => {
        setState({
          copied: false,
          error,
          value: undefined,
        });
      },
    );
  };

  return [state, copyToClipboard];
}
