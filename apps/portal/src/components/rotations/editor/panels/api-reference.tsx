"use client";

import { useState } from "react";
import { ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ApiFunction {
  name: string;
  signature: string;
  description: string;
  snippet: string;
}

interface ApiCategory {
  name: string;
  functions: ApiFunction[];
}

const API_REFERENCE: ApiCategory[] = [
  {
    name: "Casting",
    functions: [
      {
        name: "tryCast",
        signature: "tryCast(rotation, playerId, spellId, targetId?)",
        description: "Attempts to cast a spell. Returns { cast, consumedGCD }.",
        snippet: `const result = yield* tryCast(rotation, playerId, SpellIds.SPELL_NAME, targetId);
if (result.cast && result.consumedGCD) {
  return;
}`,
      },
      {
        name: "runPriorityList",
        signature: "runPriorityList(rotation, playerId, spellIds, targetId?)",
        description: "Runs spells in priority order until one consumes GCD.",
        snippet: `yield* runPriorityList(rotation, playerId, [
  SpellIds.SPELL_1,
  SpellIds.SPELL_2,
  SpellIds.SPELL_3,
], targetId);`,
      },
      {
        name: "rotation.spell.cast",
        signature: "rotation.spell.cast(playerId, spellId, targetId?)",
        description: "Low-level cast. Throws on cooldown. Use tryCast instead.",
        snippet: `yield* rotation.spell.cast(playerId, SpellIds.SPELL_NAME, targetId);`,
      },
    ],
  },
  {
    name: "Effect Utilities",
    functions: [
      {
        name: "Effect.gen",
        signature: "Effect.gen(function* () { ... })",
        description:
          "Generator function for Effect. Use yield* to run effects.",
        snippet: `Effect.gen(function* () {
  const rotation = yield* Context.RotationContext;
  // Your rotation logic here
})`,
      },
      {
        name: "Effect.succeed",
        signature: "Effect.succeed(value)",
        description: "Creates an Effect that succeeds with the given value.",
        snippet: `Effect.succeed(value)`,
      },
      {
        name: "Effect.fail",
        signature: "Effect.fail(error)",
        description: "Creates an Effect that fails with the given error.",
        snippet: `Effect.fail(new Error("Something went wrong"))`,
      },
    ],
  },
  {
    name: "Context",
    functions: [
      {
        name: "RotationContext",
        signature: "yield* Context.RotationContext",
        description: "Access the rotation context with spell casting methods.",
        snippet: `const rotation = yield* Context.RotationContext;`,
      },
    ],
  },
];

interface ApiReferenceProps {
  onInsert: (snippet: string) => void;
}

export function ApiReference({ onInsert }: ApiReferenceProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Casting"]));

  const handleCopy = (id: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleExpanded = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {API_REFERENCE.map((category) => (
        <Collapsible
          key={category.name}
          open={expanded.has(category.name)}
          onOpenChange={() => toggleExpanded(category.name)}
        >
          <CollapsibleTrigger className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-sm font-medium hover:bg-accent">
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                expanded.has(category.name) && "rotate-90",
              )}
            />
            {category.name}
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4">
            {category.functions.map((fn) => {
              const id = `${category.name}-${fn.name}`;
              return (
                <div
                  key={fn.name}
                  className="group rounded-md border bg-card p-2 my-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <code className="text-xs font-semibold text-primary">
                        {fn.name}
                      </code>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {fn.signature}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopy(id, fn.snippet)}
                      >
                        {copiedId === id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => onInsert(fn.snippet)}
                      >
                        Insert
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {fn.description}
                  </p>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
