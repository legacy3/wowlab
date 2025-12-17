"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatHex, useSpellData } from "../spell-context";

export function AttributesCard() {
  const spell = useSpellData();
  const [expanded, setExpanded] = useState(false);
  const displayedAttributes = expanded
    ? spell.attributes
    : spell.attributes.slice(0, 3);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Spell Attributes (Flags)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayedAttributes.map((attr) => (
          <div key={attr.index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Attributes[{attr.index}]:
              </span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {formatHex(attr.value)}
              </code>
            </div>
            {attr.flags.length > 0 && (
              <ul className="ml-4 space-y-0.5 text-xs">
                {attr.flags.map((flag) => (
                  <li key={flag.name} className="flex items-center gap-1">
                    <span
                      className={cn(
                        "flex h-3 w-3 items-center justify-center rounded-sm border text-[8px]",
                        flag.set
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground",
                      )}
                    >
                      {flag.set && "x"}
                    </span>
                    <span className={flag.set ? "" : "text-muted-foreground"}>
                      {flag.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {spell.attributes.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary hover:underline"
          >
            {expanded
              ? "Show less"
              : `Expand all ${spell.attributes.length} attribute flags...`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
