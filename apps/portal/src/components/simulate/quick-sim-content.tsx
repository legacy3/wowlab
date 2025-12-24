"use client";

import { Suspense } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Play, Loader2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSimulation } from "@/hooks/use-simulation";
import {
  CharacterSummaryCard,
  EquipmentColumn,
  EquipmentSlotCard,
  EQUIPMENT_LEFT_COLUMN,
  EQUIPMENT_RIGHT_COLUMN,
  EQUIPMENT_TRINKET_SLOTS,
  EQUIPMENT_WEAPON_SLOTS,
} from "@/components/equipment";
import { TalentHoverLink } from "@/components/talents";
import { SimulateIntroTour } from "@/components/tours";
import {
  clearCharacterAtom,
  selectedRotationIdAtom,
  fightDurationAtom,
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

function QuickSimContentInner() {
  const parsedData = useAtomValue(parsedCharacterAtom);
  const isParsing = useAtomValue(isParsingAtom);
  const recentCharacters = useAtomValue(recentCharactersParsedAtom);
  const clearCharacter = useSetAtom(clearCharacterAtom);
  const fightDuration = useAtomValue(fightDurationAtom);
  const selectedRotationId = useAtomValue(selectedRotationIdAtom);

  // Fetch selected rotation from database
  const { rotation: selectedRotation } = useRotation(
    selectedRotationId ?? undefined,
  );

  const { run, isRunning, result, error, resultId } = useSimulation();

  const handleRunSim = async () => {
    if (!selectedRotation?.currentVersion) {
      return;
    }
    // TODO: Load compiled rotation module and run simulation
    // await run(compiledRotation.run, fightDuration);
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

  // Character loaded: show full simulation setup
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Character + Equipment Card */}
      <Card>
        <CardHeader>
          <CharacterSummaryCard
            character={character}
            professions={professions}
            rightContent={
              talents.encoded ? (
                <TalentHoverLink encodedTalents={talents.encoded} />
              ) : null
            }
          />
        </CardHeader>
        <CardContent>
          {/* Equipment Grid */}
          <div className="grid grid-cols-3 gap-3">
            <EquipmentColumn
              gear={gear}
              position="left"
              slots={EQUIPMENT_LEFT_COLUMN}
            />

            <div className="flex items-center justify-center">
              <div className="h-28 w-28 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <User className="mx-auto mb-1 h-7 w-7" />
                  <p className="text-[11px] font-semibold">{character.name}</p>
                  <p className="text-[9px]">
                    {character.race} {character.class}
                  </p>
                </div>
              </div>
            </div>

            <EquipmentColumn
              gear={gear}
              position="right"
              slots={EQUIPMENT_RIGHT_COLUMN}
            />
          </div>

          <Separator className="my-4" />

          {/* Trinkets */}
          <div className="grid grid-cols-2 gap-3">
            {EQUIPMENT_TRINKET_SLOTS.map((slot, index) => (
              <EquipmentSlotCard
                key={slot}
                slot={slot}
                itemId={gear[slot]}
                position={index === 0 ? "left" : "right"}
              />
            ))}
          </div>

          <Separator className="my-4" />

          {/* Weapons */}
          <div className="grid grid-cols-2 gap-3">
            {EQUIPMENT_WEAPON_SLOTS.map((slot, index) => (
              <EquipmentSlotCard
                key={slot}
                slot={slot}
                itemId={gear[slot]}
                position={index === 0 ? "left" : "right"}
              />
            ))}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => clearCharacter()}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Import different character
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Rotation Picker */}
      <RotationPicker />

      {/* Fight Profile Picker */}
      <FightProfilePicker />

      {/* Divider before Advanced */}
      <Separator />

      {/* Advanced Settings */}
      <AdvancedSettings />

      {/* Run Button */}
      <Button
        size="lg"
        onClick={handleRunSim}
        disabled={isRunning || !selectedRotation?.currentVersion}
        className="w-full"
        data-tour="run-simulation"
      >
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run Simulation
          </>
        )}
      </Button>

      {/* No rotation warning */}
      {!selectedRotation && (
        <p className="text-sm text-center text-muted-foreground">
          Select a rotation to run the simulation
        </p>
      )}

      {/* Results Display */}
      {result && <SimulationResultCard result={result} resultId={resultId} />}

      {/* Error Display */}
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
