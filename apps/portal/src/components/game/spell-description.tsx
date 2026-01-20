"use client";

import { css } from "styled-system/css";

import type { SpellDescFragment } from "@/lib/engine";

import { defaultPaperdoll, useSpellDescription } from "@/lib/state";

const containerStyles = css({
  lineHeight: "relaxed",
});

const valueStyles = css({
  color: "accent.400",
  fontWeight: "medium",
});

const unresolvedStyles = css({
  color: "gray.500",
  fontStyle: "italic",
});

const spellNameStyles = css({
  color: "accent.300",
});

// TODO Redo this recipe and without nilable shit
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
      {result.fragments.map((fragment, index) => (
        <FragmentRenderer key={index} fragment={fragment} />
      ))}
    </span>
  );
}

// TODO Use parallel route
function FragmentRenderer({ fragment }: { fragment: SpellDescFragment }) {
  switch (fragment.kind) {
    case "colorEnd":
      return null;

    case "colorStart":
      // Color codes are rendered as inline styles
      // Format: cAARRGGBB (e.g., cFFFFFFFF for white)
      return null; // TODO: implement color spans if needed

    case "duration":
      return <span className={valueStyles}>{fragment.value}</span>;

    case "embedded":
      return (
        <>
          {fragment.fragments.map((f: SpellDescFragment, i: number) => (
            <FragmentRenderer key={i} fragment={f} />
          ))}
        </>
      );

    case "icon":
      // TODO: render spell icon
      return null;

    case "spellName":
      return <span className={spellNameStyles}>{fragment.name}</span>;

    case "text":
      return <>{fragment.value}</>;

    case "unresolved":
      return <span className={unresolvedStyles}>{fragment.token}</span>;

    case "value":
      return <span className={valueStyles}>{fragment.value}</span>;

    default:
      return null;
  }
}
