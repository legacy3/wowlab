import { useTimeoutEffect } from "@react-hookz/web";
import { useState } from "react";
import { toast } from "sonner";

export interface CopyToClipboardState {
  readonly copied: boolean;
  readonly error: Error | null;
  readonly value?: string;
}

export function useCopyToClipboard(
  label: string,
): [CopyToClipboardState, (value: string) => void] {
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

        toast.success(`Copied ${label} to clipboard`);

        reset();
      },
      (error) => {
        setState({
          copied: false,
          error,
          value: undefined,
        });

        toast.error("Failed to copy to clipboard");
      },
    );
  };

  return [state, copyToClipboard];
}
