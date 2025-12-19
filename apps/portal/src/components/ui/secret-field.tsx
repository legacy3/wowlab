"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

interface SecretFieldProps extends React.ComponentProps<"div"> {
  value: string;
  hiddenLength: number;
  defaultRevealed?: boolean;
  revealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
}

function SecretField({
  value,
  hiddenLength,
  defaultRevealed = false,
  revealed: controlledRevealed,
  onRevealedChange,
  className,
  ...props
}: SecretFieldProps) {
  const [internalRevealed, setInternalRevealed] =
    React.useState(defaultRevealed);

  const isControlled = controlledRevealed !== undefined;
  const isRevealed = isControlled ? controlledRevealed : internalRevealed;

  const handleToggle = () => {
    const newValue = !isRevealed;
    if (!isControlled) {
      setInternalRevealed(newValue);
    }

    onRevealedChange?.(newValue);
  };

  const displayValue = isRevealed ? value : "\u2022".repeat(hiddenLength);

  return (
    <div
      data-slot="secret-field"
      data-revealed={isRevealed}
      onClick={handleToggle}
      className={cn("flex cursor-pointer items-center gap-2", className)}
      {...props}
    >
      <div
        data-slot="secret-field-value"
        className={cn(
          "border-input dark:bg-input/30 flex h-9 w-full min-w-0 flex-1 items-center rounded-md border bg-transparent px-3 py-1 text-base shadow-xs md:text-sm",
          "select-none opacity-60",
          !isRevealed && "blur-sm",
        )}
      >
        <span className="truncate">{displayValue}</span>
      </div>

      <div className="text-muted-foreground shrink-0 p-1">
        {isRevealed ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </div>
    </div>
  );
}

interface SecretTextProps
  extends Omit<React.ComponentProps<"button">, "value"> {
  value: string;
  hiddenLength: number;
  defaultRevealed?: boolean;
  revealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
}

function SecretText({
  value,
  hiddenLength,
  defaultRevealed = false,
  revealed: controlledRevealed,
  onRevealedChange,
  className,
  ...props
}: SecretTextProps) {
  const [internalRevealed, setInternalRevealed] =
    React.useState(defaultRevealed);

  const isControlled = controlledRevealed !== undefined;
  const isRevealed = isControlled ? controlledRevealed : internalRevealed;

  const handleToggle = () => {
    const newValue = !isRevealed;
    if (!isControlled) {
      setInternalRevealed(newValue);
    }

    onRevealedChange?.(newValue);
  };

  const displayValue = isRevealed ? value : "\u2022".repeat(hiddenLength);

  return (
    <button
      type="button"
      data-slot="secret-text"
      data-revealed={isRevealed}
      onClick={handleToggle}
      className={cn(
        "inline-flex items-center gap-1 rounded px-0.5 -mx-0.5 transition-all",
        "hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "select-none cursor-pointer",
        !isRevealed && "blur-sm hover:blur-none",
        className,
      )}
      aria-label={isRevealed ? "Click to hide" : "Click to reveal"}
      {...props}
    >
      <span className="truncate">{displayValue}</span>
      {isRevealed ? (
        <EyeOff className="size-3 shrink-0 opacity-50" />
      ) : (
        <Eye className="size-3 shrink-0 opacity-50" />
      )}
    </button>
  );
}

export { SecretField, SecretText };
export type { SecretFieldProps, SecretTextProps };
