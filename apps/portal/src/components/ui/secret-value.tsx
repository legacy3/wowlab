"use client";

import type { ComponentProps } from "react";

import { ark } from "@ark-ui/react/factory";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";
import {
  secretValue,
  type SecretValueVariantProps,
} from "styled-system/recipes";

const StyledButton = styled(ark.button, secretValue);

const iconStyles = css({
  _groupHover: {
    color: "fg.muted",
  },
  color: "fg.subtle",
  flexShrink: 0,
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
    Omit<ComponentProps<typeof StyledButton>, keyof SecretValueBaseProps>,
    SecretValueBaseProps,
    SecretValueVariantProps {}

interface SecretValueBaseProps {
  defaultRevealed?: boolean;
  hiddenCharacter?: string;
  hiddenLength: number;
  onRevealedChange?: (revealed: boolean) => void;
  revealed?: boolean;
  value: string;
}

export function SecretValue({
  defaultRevealed = false,
  hiddenCharacter = "•",
  hiddenLength,
  onRevealedChange,
  revealed: controlledRevealed,
  value,
  ...props
}: SecretValueProps) {
  const [internalRevealed, setInternalRevealed] = useState(defaultRevealed);

  const isControlled = controlledRevealed !== undefined;
  const isRevealed = isControlled ? controlledRevealed : internalRevealed;

  const handleToggle = () => {
    const newValue = !isRevealed;
    if (!isControlled) {
      setInternalRevealed(newValue);
    }
    onRevealedChange?.(newValue);
  };

  const displayValue = isRevealed
    ? value
    : hiddenCharacter.repeat(hiddenLength);

  return (
    <StyledButton
      type="button"
      onClick={handleToggle}
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
    </StyledButton>
  );
}
