"use client";

import type { SpellDescFragment } from "@/lib/wasm";

import { Code } from "@/components/ui";

import { GameIcon } from ".";

interface ColoredSection {
  color: string;
  fragments: SpellDescFragment[];
  kind: "coloredSection";
}

type ProcessedFragment = SpellDescFragment | ColoredSection;

export function FragmentRenderer({
  fragments,
}: {
  fragments: SpellDescFragment[];
}) {
  const { result } = preprocessFragments(fragments);

  return (
    <>
      {result.map((f, i) => (
        <span key={i}>{renderFragment(f)}</span>
      ))}
    </>
  );
}

function Fragment({ fragment }: { fragment: SpellDescFragment }) {
  switch (fragment.kind) {
    case "colorEnd":
    case "colorStart":
      return null;

    case "duration":
    case "value":
      return (
        <span style={{ color: "var(--colors-accent-400)", fontWeight: 500 }}>
          {fragment.value}
        </span>
      );

    case "embedded":
      return <FragmentRenderer fragments={fragment.fragments} />;

    case "icon":
      return (
        <span
          style={{
            display: "inline-block",
            margin: "0 2px",
            verticalAlign: "middle",
          }}
        >
          <GameIcon iconName={fragment.path} size="sm" />
        </span>
      );

    case "rawToken":
      return <Code>{fragment.value}</Code>;

    case "spellName":
      return (
        <span style={{ color: "var(--colors-accent-300)" }}>
          {fragment.name}
        </span>
      );

    case "text":
      return <>{fragment.value}</>;

    case "unresolved":
      return (
        <span style={{ color: "var(--colors-gray-500)", fontStyle: "italic" }}>
          {fragment.token}
        </span>
      );

    default:
      return null;
  }
}

function preprocessFragments(
  fragments: SpellDescFragment[],
  endAt: "colorEnd" | null = null,
): { result: ProcessedFragment[]; consumed: number } {
  const result: ProcessedFragment[] = [];
  let i = 0;

  while (i < fragments.length) {
    const f = fragments[i];

    if (endAt && f.kind === endAt) {
      return { consumed: i + 1, result };
    }

    if (f.kind === "colorStart") {
      const hex = f.color;
      const color = `#${hex.slice(2, 4)}${hex.slice(4, 6)}${hex.slice(6, 8)}`;
      const { consumed, result: inner } = preprocessFragments(
        fragments.slice(i + 1),
        "colorEnd",
      );

      result.push({
        color,
        fragments: inner as SpellDescFragment[],
        kind: "coloredSection",
      });

      i += 1 + consumed;
    } else if (f.kind === "colorEnd") {
      i++;
    } else {
      result.push(f);
      i++;
    }
  }

  return { consumed: i, result };
}

function renderFragment(fragment: ProcessedFragment) {
  if (fragment.kind === "coloredSection") {
    return (
      <span
        style={{
          color: fragment.color,
          textShadow: "1px 1px 1px rgba(0,0,0,0.8)",
        }}
      >
        {fragment.fragments.map((f, i) => (
          <Fragment key={i} fragment={f} />
        ))}
      </span>
    );
  }

  return <Fragment fragment={fragment} />;
}
