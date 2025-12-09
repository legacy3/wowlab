"use client";

import { InsertableCard } from "../../insertables";
import { SNIPPETS } from "./snippets.data";

interface SnippetsProps {
  onInsert: (snippet: string) => void;
}

export function Snippets({ onInsert }: SnippetsProps) {
  return (
    <div className="space-y-2">
      {SNIPPETS.map((snippet) => (
        <InsertableCard
          key={snippet.id}
          title={snippet.name}
          description={snippet.description}
          snippet={snippet.code}
          onInsert={onInsert}
        />
      ))}
    </div>
  );
}
