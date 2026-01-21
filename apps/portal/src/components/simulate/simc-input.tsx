"use client";

import { useIntlayer } from "next-intlayer";
import { css, cx } from "styled-system/css";

import type { TextareaProps } from "@/components/ui";

import { Textarea } from "@/components/ui";

const SIMC_EXAMPLE = [
  'shaman="Wellenwilli"',
  "level=80",
  "race=tauren",
  "region=eu",
  "server=blackmoore",
  "spec=restoration",
  "",
  "talents=CgQAL+iDLHPJSLC ...",
  "",
  "head=,id=212011,bonus_id=6652/10877...",
].join("\n");

const simcInputStyles = css({
  _focus: {
    borderStyle: "solid",
  },
  borderStyle: "dashed",
  fontFamily: "mono",
  minH: "320px",
  textStyle: "xs",
});

export interface SimcInputProps extends Omit<TextareaProps, "placeholder"> {
  placeholder?: string;
}

export function SimcInput({
  className,
  placeholder,
  ...props
}: SimcInputProps) {
  const { simcInput: content } = useIntlayer("simulate");
  const defaultPlaceholder = `${content.placeholder}\n\n${SIMC_EXAMPLE}`;

  return (
    <Textarea
      variant="outline"
      size="lg"
      placeholder={placeholder ?? defaultPlaceholder}
      className={cx(simcInputStyles, className)}
      {...props}
    />
  );
}
