"use client";

import { ExternalLink } from "lucide-react";
import { useSpell } from "@/hooks/use-spell";

export function WowSpellLink({ spellId }: { spellId: number }) {
  const { data: spell, isLoading } = useSpell(spellId);
  const name = isLoading ? `Spell ${spellId}` : (spell?.name ?? `Spell ${spellId}`);

  return (
    <a
      href={`https://www.wowhead.com/spell=${spellId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 hover:underline"
    >
      {name}
      <ExternalLink className="h-3 w-3 opacity-50" />
    </a>
  );
}
