"use client";

import { useExtracted } from "next-intl";
import { Stack } from "styled-system/jsx";

import {
  selectIsParsing,
  selectParseError,
  useCharacterInput,
} from "@/lib/sim";

import { ParseError, ParseLoading } from "../parse-status";
import { SimcInput } from "../simc-input";

export function ImportStep() {
  const t = useExtracted();
  const input = useCharacterInput((s) => s.input);
  const setInput = useCharacterInput((s) => s.setInput);
  const isParsing = useCharacterInput(selectIsParsing);
  const parseError = useCharacterInput(selectParseError);

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
    </Stack>
  );
}
