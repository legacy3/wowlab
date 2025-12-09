"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { InsertableCard } from "../../insertables";
import { API_REFERENCE } from "./api-reference.data";

interface ApiReferenceProps {
  onInsert: (snippet: string) => void;
}

export function ApiReference({ onInsert }: ApiReferenceProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Casting"]));

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
          <CollapsibleContent className="pl-4 space-y-1">
            {category.functions.map((fn) => (
              <InsertableCard
                key={fn.name}
                title={fn.name}
                subtitle={fn.signature}
                description={fn.description}
                snippet={fn.snippet}
                onInsert={onInsert}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
