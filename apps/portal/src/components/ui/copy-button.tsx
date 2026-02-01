"use client";

import type { ComponentProps } from "react";

import { ark } from "@ark-ui/react/factory";
import { useBoolean, useMemoizedFn, useTimeout } from "ahooks";
import { CheckIcon, ClipboardIcon } from "lucide-react";
import { styled } from "styled-system/jsx";
import { copyButton, type CopyButtonVariantProps } from "styled-system/recipes";

import { Tooltip } from "./tooltip";

const StyledButton = styled(ark.button, copyButton);

export interface CopyButtonProps
  extends
    CopyButtonVariantProps,
    Omit<ComponentProps<typeof StyledButton>, "children"> {
  /** The content to copy to clipboard */
  content: string;
  /** Label shown after copying (default: "Copied!") */
  copiedLabel?: string;
  /** Whether to show only the icon */
  iconOnly?: boolean;
  /** Label shown when not copied (default: "Copy") */
  label?: string;
  /** How long to show the copied state in ms (default: 2000) */
  timeout?: number;
  /** Tooltip content when not copied */
  tooltipContent?: string;
  /** Tooltip content when copied */
  tooltipCopiedContent?: string;
}

export function CopyButton({
  content,
  copiedLabel = "Copied!",
  iconOnly = false,
  label = "Copy",
  timeout = 2000,
  tooltipContent,
  tooltipCopiedContent,
  ...props
}: CopyButtonProps) {
  const [copied, { setFalse: clearCopied, setTrue: setCopied }] =
    useBoolean(false);

  useTimeout(clearCopied, copied ? timeout : undefined);

  const handleCopy = useMemoizedFn(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied();
  });

  const button = (
    <StyledButton
      type="button"
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
      {...props}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
      {!iconOnly && (copied ? copiedLabel : label)}
    </StyledButton>
  );

  if (tooltipContent || tooltipCopiedContent) {
    return (
      <Tooltip
        content={
          copied
            ? (tooltipCopiedContent ?? copiedLabel)
            : (tooltipContent ?? label)
        }
      >
        {button}
      </Tooltip>
    );
  }

  return button;
}
