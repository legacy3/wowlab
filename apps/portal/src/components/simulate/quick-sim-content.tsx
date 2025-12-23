"use client";

import { Suspense, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatInt } from "@/lib/format";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Play,
  ChevronDown,
  Settings2,
  Check,
  ChevronsUpDown,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useSimulation } from "@/hooks/use-simulation";
import { BeastMasteryRotation } from "@/lib/simulation";
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
import {
  clearCharacterAtom,
  fightDurationAtom,
  isParsingAtom,
  iterationsAtom,
  parseErrorAtom,
  parsedCharacterAtom,
  recentCharactersParsedAtom,
  setSimcInputAtom,
  simcInputAtom,
  targetTypeAtom,
  type TargetType,
} from "@/atoms/sim";
import { SimulateIntroTour } from "@/components/tours";

interface FightProfile {
  id: TargetType;
  label: string;
  description: string;
  group: "Standard" | "Raid" | "Dungeon";
}

const FIGHT_PROFILES: FightProfile[] = [
  {
    id: "patchwerk",
    label: "Patchwerk",
    description: "Single target, stand still",
    group: "Standard",
  },
  {
    id: "movement",
    label: "Light Movement",
    description: "Single target with periodic movement",
    group: "Standard",
  },
  {
    id: "aoe",
    label: "Multi-Target",
    description: "Sustained cleave, 3-5 targets",
    group: "Standard",
  },
];

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

function QuickSimContentInner() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fightPickerOpen, setFightPickerOpen] = useState(false);

  // Character atoms
  const simcInput = useAtomValue(simcInputAtom);
  const setSimcInput = useSetAtom(setSimcInputAtom);
  const clearCharacter = useSetAtom(clearCharacterAtom);
  const parsedData = useAtomValue(parsedCharacterAtom);
  const parseError = useAtomValue(parseErrorAtom);
  const isParsing = useAtomValue(isParsingAtom);
  const recentCharacters = useAtomValue(recentCharactersParsedAtom);

  // Config atoms
  const [fightDuration, setFightDuration] = useAtom(fightDurationAtom);
  const [iterations, setIterations] = useAtom(iterationsAtom);
  const [targetType, setTargetType] = useAtom(targetTypeAtom);

  const { run, isRunning, result, error, resultId } = useSimulation({
    onComplete: (result) => {
      console.log("Simulation complete!", result);
    },
  });

  const selectedProfile =
    FIGHT_PROFILES.find((p) => p.id === targetType) ?? FIGHT_PROFILES[0];

  const handleSimcChange = (value: string) => {
    setSimcInput(value);
  };

  const handleClear = () => {
    clearCharacter();
  };

  const handleRunSim = async () => {
    // For now, use the BeastMasteryRotation directly
    // Later this will be derived from the parsed character spec
    await run(BeastMasteryRotation, fightDuration);
  };

  // Zen state: just the paste area
  if (!parsedData) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {recentCharacters.length > 0 && (
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1"
            data-tour="recent-characters"
          >
            {recentCharacters.map((entry, index) => {
              const { simc, data } = entry;
              const { character, professions } = data;
              const tooltipText = [
                character.class,
                character.spec,
                character.server,
                character.region,
                professions.length > 0
                  ? professions.map((p) => `${p.name} ${p.rank}`).join(" • ")
                  : null,
              ]
                .filter(Boolean)
                .join(" • ");

              return (
                <Tooltip
                  key={`${character.name}-${character.server}-chip-${index}`}
                >
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 px-2 text-xs font-medium"
                      onClick={() => handleSimcChange(simc)}
                    >
                      {character.name}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    {tooltipText}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        <Textarea
          value={simcInput}
          onChange={(e) => handleSimcChange(e.target.value)}
          placeholder={DEFAULT_SIMC_PLACEHOLDER}
          className="min-h-80 border-dashed border-2 font-mono text-sm focus:border-solid"
          autoFocus
          data-tour="simc-input"
        />

        {/* Parsing indicator */}
        {isParsing && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Parsing SimC data...
          </div>
        )}

        {/* Parse error display */}
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

        <SimulateIntroTour
          show={!parsedData && !isParsing}
          hasRecentCharacters={recentCharacters.length > 0}
        />
      </div>
    );
  }

  // Group profiles by category
  const groupedProfiles = FIGHT_PROFILES.reduce(
    (acc, profile) => {
      if (!acc[profile.group]) {
        acc[profile.group] = [];
      }

      acc[profile.group].push(profile);

      return acc;
    },
    {} as Record<string, FightProfile[]>,
  );

  const { character, professions, gear, talents } = parsedData;

  // Character loaded: show full equipment preview
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
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Import different character
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Fight Profile Picker */}
      <div className="space-y-2" data-tour="fight-profile">
        <Label className="text-sm font-medium">Fight Profile</Label>
        <Popover open={fightPickerOpen} onOpenChange={setFightPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={fightPickerOpen}
              className="w-full justify-between h-auto py-3"
            >
              <div className="text-left">
                <div className="font-medium">{selectedProfile.label}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedProfile.description}
                </div>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-(--radix-popover-trigger-width) p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search profiles..." />
              <CommandList>
                <CommandEmpty>No profile found.</CommandEmpty>
                {Object.entries(groupedProfiles).map(([group, profiles]) => (
                  <CommandGroup key={group} heading={group}>
                    {profiles.map((profile) => (
                      <CommandItem
                        key={profile.id}
                        value={profile.id}
                        onSelect={() => {
                          setTargetType(profile.id);
                          setFightPickerOpen(false);
                        }}
                        className="flex flex-col items-start gap-1 py-3"
                      >
                        <div className="flex w-full items-center">
                          <span className="font-medium">{profile.label}</span>
                          {targetType === profile.id && (
                            <Check className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {profile.description}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Divider before Advanced */}
      <Separator />

      {/* Advanced Settings */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Advanced Settings
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm">
                Fight Duration
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="duration"
                  type="number"
                  value={fightDuration}
                  onChange={(e) => setFightDuration(Number(e.target.value))}
                  min={30}
                  max={900}
                />
                <span className="text-sm text-muted-foreground shrink-0">
                  sec
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="iterations" className="text-sm">
                Iterations
              </Label>
              <Input
                id="iterations"
                type="number"
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                min={100}
                max={50000}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Run Button */}
      <Button
        size="lg"
        onClick={handleRunSim}
        disabled={isRunning}
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

      {/* Results Display */}
      {result && (
        <Card className="border-green-500/25 bg-green-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Simulation Complete
              </p>
              {resultId && (
                <Link
                  href={`/simulate/results/${resultId}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View full results →
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <p className="text-2xl font-semibold tabular-nums">
              {formatInt(Math.round(result.dps))} DPS
            </p>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total Damage</p>
                <p className="font-medium tabular-nums">
                  {formatInt(result.totalDamage)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Casts</p>
                <p className="font-medium tabular-nums">
                  {formatInt(result.casts)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Events</p>
                <p className="font-medium tabular-nums">
                  {formatInt(result.events.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Simulation Failed
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
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
