"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { AlertCircle } from "lucide-react";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";

import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  isParsingAtom,
  parseErrorAtom,
  setSimcInputAtom,
  simcInputAtom,
} from "@/atoms/sim";

const DEFAULT_SIMC_PLACEHOLDER = [
  "Paste your SimulationCraft export here...",
  "",
  'shaman="Wellenwilli"',
  "level=80",
  "race=tauren",
  "region=eu",
  "server=blackmoore",
  "spec=restoration",
  "",
  "talents=CgQAL+iDLHPJSLC...",
  "",
  "head=,id=212011,bonus_id=6652/10877...",
].join("\n");

export function SimcPasteArea() {
  const simcInput = useAtomValue(simcInputAtom);
  const setSimcInput = useSetAtom(setSimcInputAtom);
  const isParsing = useAtomValue(isParsingAtom);
  const parseError = useAtomValue(parseErrorAtom);

  return (
    <>
      <Textarea
        value={simcInput}
        onChange={(e) => setSimcInput(e.target.value)}
        placeholder={DEFAULT_SIMC_PLACEHOLDER}
        className="min-h-80 border-dashed border-2 font-mono text-sm focus:border-solid"
        autoFocus
        data-tour="simc-input"
      />

      {isParsing && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <FlaskInlineLoader className="h-4 w-4" />
          Parsing SimC data...
        </div>
      )}

      {parseError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Failed to parse SimC export
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {parseError}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
