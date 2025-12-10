"use client";

import { useSpell } from "@/hooks/use-spell";
import { WowLink } from "./wow-link";

export function WowSpellLink({ spellId }: { spellId: number }) {
  const { data: spell, isLoading } = useSpell(spellId);

  return (
    <WowLink
      href={`https://www.wowhead.com/spell=${spellId}`}
      name={spell?.name}
      fallback={`Spell ${spellId}`}
      isLoading={isLoading}
    />
  );
}
