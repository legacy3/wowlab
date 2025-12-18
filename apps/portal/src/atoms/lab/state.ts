"use client";

import { createPersistedOrderAtom } from "../utils";

export type LabCardId = "data-inspector" | "spec-coverage" | "table-coverage";

export const labOrderAtom = createPersistedOrderAtom<LabCardId>(
  "lab-order-v4",
  ["data-inspector", "spec-coverage", "table-coverage"],
);

// Spell Detail Page
export type SpellDetailCardId =
  | "header"
  | "quick-stats"
  | "effects"
  | "proc-mechanics"
  | "scaling"
  | "attributes"
  | "spell-class"
  | "aura-restrictions"
  | "shapeshift"
  | "labels"
  | "empower"
  | "related-spells"
  | "raw-data"
  | "simulation-notes";

export const spellDetailOrderAtom = createPersistedOrderAtom<SpellDetailCardId>(
  "spell-detail-order-v1",
  [
    "header",
    "quick-stats",
    "effects",
    "proc-mechanics",
    "scaling",
    "attributes",
    "spell-class",
    "aura-restrictions",
    "shapeshift",
    "labels",
    "empower",
    "related-spells",
    "raw-data",
    "simulation-notes",
  ],
);

// Item Detail Page
export type ItemDetailCardId =
  | "header"
  | "classification"
  | "stat-breakdown"
  | "bonus-ids"
  | "upgrade-path"
  | "sockets"
  | "set-bonuses"
  | "item-effects"
  | "armor-calculation"
  | "spec-usability"
  | "drop-sources"
  | "item-flags"
  | "crafting"
  | "raw-data"
  | "simulation";

export const itemDetailOrderAtom = createPersistedOrderAtom<ItemDetailCardId>(
  "item-detail-order-v1",
  [
    "header",
    "classification",
    "stat-breakdown",
    "bonus-ids",
    "upgrade-path",
    "sockets",
    "set-bonuses",
    "item-effects",
    "armor-calculation",
    "spec-usability",
    "drop-sources",
    "item-flags",
    "crafting",
    "raw-data",
    "simulation",
  ],
);
