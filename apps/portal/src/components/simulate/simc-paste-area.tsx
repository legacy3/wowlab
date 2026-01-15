"use client";

import { useExtracted } from "next-intl";
import { Stack } from "styled-system/jsx";

import {
  selectIsParsing,
  selectParseError,
  selectProfile,
  useCharacterInput,
} from "@/lib/sim";

import { CharacterCard } from "./character-card";
import { ParseError, ParseLoading } from "./parse-status";
import { SimcInput } from "./simc-input";

export function SimcPasteArea() {
  const t = useExtracted();
  const input = useCharacterInput((s) => s.input);
  const setInput = useCharacterInput((s) => s.setInput);
  const isParsing = useCharacterInput(selectIsParsing);
  const parseError = useCharacterInput(selectParseError);
  const profile = useCharacterInput(selectProfile);

  return (
    <Stack gap="4">
      <SimcInput value={input} onChange={(e) => setInput(e.target.value)} />

      {isParsing && <ParseLoading message={t("Parsing SimC data...")} />}

      {parseError && (
        <ParseError
          title={t("Failed to parse SimC export")}
          error={parseError}
        />
      )}

      {profile && (
        <CharacterCard
          character={profile.character}
          professions={profile.character.professions}
        />
      )}
    </Stack>
  );
}
