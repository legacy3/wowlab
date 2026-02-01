"use client";

import type { ComponentProps } from "react";

import { ark } from "@ark-ui/react/factory";
import {
  useBoolean,
  useControllableValue,
  useMemoizedFn,
  useTimeout,
} from "ahooks";
import { CheckIcon, ClipboardIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";
import {
  secretValue,
  type SecretValueVariantProps,
} from "styled-system/recipes";

const StyledContainer = styled(ark.div, secretValue);

const iconStyles = css({
  _groupHover: {
    color: "fg.muted",
  },
  color: "fg.subtle",
  flexShrink: 0,
  transition: "color 0.15s ease-in-out",
});

const copyIconStyles = css({
  _groupHover: {
    color: "fg.muted",
  },
  color: "fg.subtle",
  cursor: "pointer",
  flexShrink: 0,
  ml: "auto",
  transition: "color 0.15s ease-in-out",
});

const valueStyles = css({
  "&[data-hidden]": {
    filter: "blur(4px)",
  },
  "&[data-hidden]:hover": {
    filter: "blur(2px)",
  },
  fontFamily: "code",
  lineHeight: "1",
  transition: "filter 0.15s ease-in-out",
  truncate: true,
});

export interface SecretValueProps
  extends
    Omit<ComponentProps<typeof StyledContainer>, keyof SecretValueBaseProps>,
    SecretValueBaseProps,
    SecretValueVariantProps {}

interface SecretValueBaseProps {
  copyable?: boolean;
  defaultRevealed?: boolean;
  hiddenCharacter?: string;
  hiddenLength: number;
  onRevealedChange?: (revealed: boolean) => void;
  revealed?: boolean;
  value: string;
}

export function SecretValue({
  copyable = false,
  defaultRevealed = false,
  hiddenCharacter = "•",
  hiddenLength,
  onRevealedChange,
  revealed: controlledRevealed,
  value,
  ...props
}: SecretValueProps) {
  const [isRevealed, setRevealed] = useControllableValue({
    defaultValue: defaultRevealed,
    onChange: onRevealedChange,
    value: controlledRevealed,
  });
  const [copied, { setFalse: clearCopied, setTrue: setCopied }] =
    useBoolean(false);

  useTimeout(clearCopied, copied ? 2000 : undefined);

  const handleToggle = () => {
    setRevealed(!isRevealed);
  };

  const handleCopy = useMemoizedFn(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied();
  });

  const displayValue = isRevealed
    ? value
    : hiddenCharacter.repeat(hiddenLength);

  return (
    <StyledContainer
      role="button"
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={(e) => e.key === "Enter" && handleToggle()}
      aria-label={isRevealed ? "Click to hide" : "Click to reveal"}
      aria-pressed={isRevealed}
      className="group"
      {...props}
    >
      <span className={iconStyles}>
        {isRevealed ? <EyeOffIcon size="1em" /> : <EyeIcon size="1em" />}
      </span>
      <span className={valueStyles} data-hidden={!isRevealed ? "" : undefined}>
        {displayValue}
      </span>
      {copyable && (
        <span
          role="button"
          tabIndex={0}
          className={copyIconStyles}
          onClick={handleCopy}
          onKeyDown={(e) =>
            e.key === "Enter" && handleCopy(e as unknown as React.MouseEvent)
          }
          aria-label="Copy to clipboard"
        >
          {copied ? <CheckIcon size="1em" /> : <ClipboardIcon size="1em" />}
        </span>
      )}
    </StyledContainer>
  );
}
