"use client";

import { Suspense } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Play } from "lucide-react";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDistributedSimulation,
  extractSpellIdsFromScript,
} from "@/hooks/rotations";
import {
  CharacterEquipmentPanel,
  type CharacterStats,
} from "@/components/equipment";
import { TalentHoverLink } from "@/components/talents";
import { SimulateIntroTour } from "@/components/tours";
import {
  clearCharacterAtom,
  selectedRotationIdAtom,
  fightDurationAtom,
  iterationsAtom,
  isParsingAtom,
  parsedCharacterAtom,
  recentCharactersParsedAtom,
} from "@/atoms/sim";
import { useRotation } from "@/hooks/rotations";
import { AdvancedSettings } from "./advanced-settings";
import { FightProfilePicker } from "./fight-profile-picker";
import { RecentCharacterChips } from "./recent-character-chips";
import { RotationPicker } from "./rotation-picker";
import { SimcPasteArea } from "./simc-paste-area";
import { SimulationErrorCard } from "./simulation-error-card";
import { SimulationResultCard } from "./simulation-result-card";

// Mock stats until we parse them from simc
const MOCK_STATS: CharacterStats = {
  primaryStat: 40000,
  stamina: 110000,
  criticalStrike: 25,
  haste: 30,
  mastery: 30,
  versatility: 10,
};

function QuickSimContentInner() {
  const parsedData = useAtomValue(parsedCharacterAtom);
  const isParsing = useAtomValue(isParsingAtom);
  const recentCharacters = useAtomValue(recentCharactersParsedAtom);
  const clearCharacter = useSetAtom(clearCharacterAtom);
  const fightDuration = useAtomValue(fightDurationAtom);
  const iterations = useAtomValue(iterationsAtom);
  const selectedRotationId = useAtomValue(selectedRotationIdAtom);

  // Fetch selected rotation from database
  const { rotation: selectedRotation } = useRotation(
    selectedRotationId ?? undefined,
  );

  const {
    run,
    isRunning,
    result: distResult,
    error,
  } = useDistributedSimulation();

  const result = distResult
    ? {
        dps: distResult.meanDps,
        totalDamage: distResult.meanDps * fightDuration,
        durationMs: fightDuration * 1000,
        events: [],
        casts: distResult.chunksCompleted,
      }
    : null;

  const handleRunSim = async () => {
    if (!selectedRotation?.id || !selectedRotation?.script) {
      return;
    }
    const spellIds = extractSpellIdsFromScript(selectedRotation.script);
    await run({
      rotationId: selectedRotation.id,
      spellIds,
      duration: fightDuration,
      iterations,
      name: selectedRotation.name,
    });
  };

  // Zen state: just the paste area
  if (!parsedData) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <RecentCharacterChips />
        <SimcPasteArea />
        <SimulateIntroTour
          show={!parsedData && !isParsing}
          hasRecentCharacters={recentCharacters.length > 0}
        />
      </div>
    );
  }

  const { character, professions, gear, talents } = parsedData;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <CharacterEquipmentPanel
        character={character}
        gear={gear}
        stats={MOCK_STATS}
        professions={professions}
        rightContent={
          talents.encoded ? (
            <TalentHoverLink encodedTalents={talents.encoded} />
          ) : null
        }
        onClear={() => clearCharacter()}
      />

      <RotationPicker />

      <FightProfilePicker />

      <Separator />

      <AdvancedSettings />

      <Button
        size="lg"
        onClick={handleRunSim}
        disabled={isRunning || !selectedRotation?.currentVersion}
        className="w-full"
        data-tour="run-simulation"
      >
        {isRunning ? (
          <>
            <FlaskInlineLoader className="mr-2 h-4 w-4" variant="processing" />
            Running...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run Simulation
          </>
        )}
      </Button>

      {!selectedRotation && (
        <p className="text-sm text-center text-muted-foreground">
          Select a rotation to run the simulation
        </p>
      )}

      {result && <SimulationResultCard result={result} resultId={null} />}

      {error && <SimulationErrorCard error={error} />}
    </div>
  );
}

function QuickSimContentSkeleton() {
  return (
    <div className="mx-auto max-w-2xl">
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}

export function QuickSimContent() {
  return (
    <Suspense fallback={<QuickSimContentSkeleton />}>
      <QuickSimContentInner />
    </Suspense>
  );
}
