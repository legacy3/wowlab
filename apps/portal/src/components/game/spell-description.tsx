"use client";

import { css } from "styled-system/css";

import { defaultPaperdoll, useSpellDescription } from "@/lib/state";

import { FragmentRenderer } from ".";

const containerStyles = css({
  lineHeight: "relaxed",
});

export interface SpellDescriptionProps {
  className?: string;
  description?: string;
  fallback?: string;
  spellId: number | null | undefined;
}

export function SpellDescription({
  className,
  description,
  fallback = "No description available",
  spellId,
}: SpellDescriptionProps) {
  const { isLoading, result } = useSpellDescription(
    spellId,
    description,
    defaultPaperdoll,
  );

  if (!spellId && !description) {
    return <span className={className}>{fallback}</span>;
  }

  if (isLoading || !result) {
    return <span className={className}>{description ?? "Loading..."}</span>;
  }

  return (
    <span className={`${containerStyles} ${className ?? ""}`}>
      <FragmentRenderer fragments={result.fragments} />
    </span>
  );
}
