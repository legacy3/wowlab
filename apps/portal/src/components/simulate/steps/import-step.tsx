"use client";

import { useIntlayer } from "next-intlayer";
import { Stack } from "styled-system/jsx";

import {
  selectIsParsing,
  selectParseError,
  useCharacterInput,
} from "@/lib/sim";

import { ParseError, ParseLoading } from "../parse-status";
import { RecentProfiles } from "../recent-profiles";
import { SimcInput } from "../simc-input";

export function ImportStep() {
  const { importStep: content } = useIntlayer("simulate");
  const input = useCharacterInput((s) => s.input);
  const setInput = useCharacterInput((s) => s.setInput);
  const isParsing = useCharacterInput(selectIsParsing);
  const parseError = useCharacterInput(selectParseError);

  return (
    <Stack gap="4">
      <RecentProfiles />

      <SimcInput value={input} onChange={(e) => setInput(e.target.value)} />

      {isParsing && <ParseLoading message={content.parsingSimCData} />}

      {parseError && (
        <ParseError
          title={content.failedToParseSimCExport.value}
          error={parseError}
        />
      )}
    </Stack>
  );
}
