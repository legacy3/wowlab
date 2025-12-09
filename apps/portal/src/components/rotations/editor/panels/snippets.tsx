"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Snippet {
  id: string;
  name: string;
  description: string;
  code: string;
}

const SNIPPETS: Snippet[] = [
  {
    id: "rotation-template",
    name: "Rotation Template",
    description: "Full rotation definition boilerplate",
    code: `import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";
import type { RotationDefinition } from "../framework/types.js";
import { tryCast } from "../framework/rotation-utils.js";

const SpellIds = {
  // Add spell IDs here
} as const;

export const MyRotation: RotationDefinition = {
  name: "My Rotation",

  run: (playerId, targetId) =>
    Effect.gen(function* () {
      const rotation = yield* Context.RotationContext;

      // Add rotation logic here
    }),

  spellIds: [
    // Add spell IDs used by rotation
  ],
};`,
  },
  {
    id: "try-cast-gcd",
    name: "Try Cast (with GCD check)",
    description: "Cast a spell and return if it consumed GCD",
    code: `const result = yield* tryCast(rotation, playerId, SpellIds.SPELL_NAME, targetId);
if (result.cast && result.consumedGCD) {
  return;
}`,
  },
  {
    id: "try-cast-offgcd",
    name: "Try Cast (Off-GCD)",
    description: "Cast an off-GCD ability without target",
    code: `const result = yield* tryCast(rotation, playerId, SpellIds.SPELL_NAME);
if (result.cast && result.consumedGCD) {
  return;
}`,
  },
  {
    id: "priority-list",
    name: "Priority List",
    description: "Simple priority list of spells",
    code: `yield* runPriorityList(rotation, playerId, [
  SpellIds.SPELL_1,
  SpellIds.SPELL_2,
  SpellIds.SPELL_3,
], targetId);`,
  },
  {
    id: "spell-ids-block",
    name: "Spell IDs Block",
    description: "Spell ID constants declaration",
    code: `const SpellIds = {
  SPELL_NAME: 12345,
  ANOTHER_SPELL: 67890,
} as const;`,
  },
  {
    id: "conditional-cast",
    name: "Conditional Cast",
    description: "Cast based on a condition",
    code: `// Example: Cast only if some condition is met
const shouldCast = true; // Replace with actual condition
if (shouldCast) {
  const result = yield* tryCast(rotation, playerId, SpellIds.SPELL_NAME, targetId);
  if (result.cast && result.consumedGCD) {
    return;
  }
}`,
  },
  {
    id: "cooldowns-section",
    name: "Cooldowns Section",
    description: "Off-GCD cooldowns at the start",
    code: `// Cooldowns (off-GCD)
yield* tryCast(rotation, playerId, SpellIds.MAJOR_COOLDOWN);
yield* tryCast(rotation, playerId, SpellIds.MINOR_COOLDOWN);`,
  },
  {
    id: "filler-section",
    name: "Filler Section",
    description: "Filler spell at the end",
    code: `// Filler
yield* tryCast(rotation, playerId, SpellIds.FILLER_SPELL, targetId);`,
  },
];

interface SnippetsProps {
  onInsert: (snippet: string) => void;
}

export function Snippets({ onInsert }: SnippetsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-2">
      {SNIPPETS.map((snippet) => (
        <div
          key={snippet.id}
          className="group rounded-md border bg-card p-2 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="font-medium text-sm">{snippet.name}</span>
              <p className="text-[10px] text-muted-foreground">
                {snippet.description}
              </p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCopy(snippet.id, snippet.code)}
              >
                {copiedId === snippet.id ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onInsert(snippet.code)}
              >
                Insert
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
