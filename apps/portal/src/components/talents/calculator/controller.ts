"use client";

import { useCallback, useMemo, useRef } from "react";
import { useQueryState, parseAsString } from "nuqs";
import {
  decodeTalentLoadout,
  encodeSelectionsToLoadoutString,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
import * as Effect from "effect/Effect";
import { applyDecodedTalents } from "@wowlab/services/Data";
import type { TalentSelection } from "@wowlab/services/Talents";
import { useTalentTree } from "@/hooks/use-talent-tree";
import { createHeaderOnlyTalentString } from "./talent-encoding";

export function useTalentCalculatorController() {
  const [talents, setTalents] = useQueryState(
    "talents",
    parseAsString.withDefault("").withOptions({
      shallow: true,
      history: "push",
      throttleMs: 300,
    }),
  );

  const decoded = useMemo((): DecodedTalentLoadout | null => {
    if (!talents) {
      return null;
    }

    const effect = decodeTalentLoadout(talents);
    const result = Effect.runSync(Effect.either(effect));

    if (result._tag === "Right") {
      return result.right;
    }

    return null;
  }, [talents]);

  const effectiveSpecId = decoded?.specId ?? null;
  const { data: tree, isLoading, error } = useTalentTree(effectiveSpecId);

  const treeDrivenTalentsRef = useRef<string | null>(null);
  const initialSelectionsKey = useMemo(() => {
    if (!talents) {
      return null;
    }
    return talents === treeDrivenTalentsRef.current ? null : talents;
  }, [talents]);

  const initialSelections = useMemo(() => {
    if (!tree || !decoded) {
      return new Map<number, TalentSelection>();
    }
    return applyDecodedTalents(tree, decoded).selections;
  }, [decoded, tree]);

  const handleSpecSelect = useCallback(
    (specId: number) => {
      treeDrivenTalentsRef.current = null;
      setTalents(createHeaderOnlyTalentString(specId));
    },
    [setTalents],
  );

  const handleTalentStringChange = useCallback(
    (next: string | null) => {
      treeDrivenTalentsRef.current = null;
      setTalents(next);
    },
    [setTalents],
  );

  const handleSelectionsChange = useCallback(
    (selections: Map<number, TalentSelection>) => {
      if (!decoded || !tree) {
        return;
      }
      const next = encodeSelectionsToLoadoutString({
        tree,
        decoded,
        selections,
      });

      if (next !== talents) {
        treeDrivenTalentsRef.current = next;
        setTalents(next);
      }
    },
    [decoded, setTalents, talents, tree],
  );

  return {
    talents,
    decoded,
    effectiveSpecId,
    tree,
    isLoading,
    error,
    initialSelections,
    initialSelectionsKey,
    onSpecSelect: handleSpecSelect,
    onTalentStringChange: handleTalentStringChange,
    onSelectionsChange: handleSelectionsChange,
  };
}
