"use client";

import { Suspense, useState } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
} from "lucide-react";
import {
  CharacterSummaryCard,
  EquipmentColumn,
  EquipmentSlotCard,
  EQUIPMENT_LEFT_COLUMN,
  EQUIPMENT_RIGHT_COLUMN,
  EQUIPMENT_TRINKET_SLOTS,
  EQUIPMENT_WEAPON_SLOTS,
  type EquipmentSlot,
  type EquipmentSlotItem,
  type CharacterSummary,
  type CharacterProfession,
} from "@/components/equipment";
import {
  fightDurationAtom,
  iterationsAtom,
  targetTypeAtom,
  type TargetType,
} from "@/atoms/sim";

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

// Mock parsed data - in real implementation this comes from SimC parser
interface ParsedSimcData {
  character: CharacterSummary;
  professions: CharacterProfession[];
  gear: Record<EquipmentSlot, EquipmentSlotItem | null>;
}

const MOCK_PARSED_DATA: ParsedSimcData = {
  character: {
    name: "Wellenwilli",
    server: "Blackmoore",
    region: "EU",
    level: 80,
    spec: "Restoration",
    race: "Tauren",
    class: "Shaman",
  },
  professions: [
    { name: "Alchemy", rank: 100 },
    { name: "Jewelcrafting", rank: 85 },
  ],
  gear: {
    head: {
      id: 212011,
      ilvl: 623,
      name: "Waves of the Forgotten Reservoir",
      isUpgrade: false,
    },
    neck: {
      id: 215136,
      ilvl: 619,
      name: "Amulet of Earthen Craftsmanship",
      isUpgrade: false,
    },
    shoulder: {
      id: 212014,
      ilvl: 619,
      name: "Spaulders of the Forgotten Reservoir",
      isUpgrade: false,
    },
    back: {
      id: 222817,
      ilvl: 616,
      name: "Consecrated Cloak",
      isUpgrade: false,
    },
    chest: {
      id: 212010,
      ilvl: 623,
      name: "Robes of the Forgotten Reservoir",
      isUpgrade: false,
    },
    wrist: {
      id: 219334,
      ilvl: 619,
      name: "Devoted Wristguards",
      isUpgrade: false,
    },
    hands: {
      id: 212012,
      ilvl: 619,
      name: "Grips of the Forgotten Reservoir",
      isUpgrade: false,
    },
    waist: { id: 219331, ilvl: 619, name: "Devoted Sash", isUpgrade: false },
    legs: {
      id: 212013,
      ilvl: 619,
      name: "Legwraps of the Forgotten Reservoir",
      isUpgrade: false,
    },
    feet: { id: 219333, ilvl: 616, name: "Devoted Slippers", isUpgrade: false },
    finger1: {
      id: 215135,
      ilvl: 619,
      name: "Ring of Earthen Resolve",
      isUpgrade: true,
    },
    finger2: {
      id: 225577,
      ilvl: 623,
      name: "Seal of the Poisoned Pact",
      isUpgrade: false,
    },
    trinket1: {
      id: 225648,
      ilvl: 623,
      name: "Candle of Collective Anguish",
      isUpgrade: false,
    },
    trinket2: {
      id: 219314,
      ilvl: 619,
      name: "Carved Blazikon Wax",
      isUpgrade: true,
    },
    mainHand: {
      id: 222568,
      ilvl: 623,
      name: "Siphoning Dagger",
      isUpgrade: false,
    },
    offHand: {
      id: 222566,
      ilvl: 619,
      name: "Vagabond's Torch",
      isUpgrade: false,
    },
  },
};

function QuickSimContentInner() {
  const [simcString, setSimcString] = useState("");
  const [parsedData, setParsedData] = useState<ParsedSimcData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fightPickerOpen, setFightPickerOpen] = useState(false);

  const [fightDuration, setFightDuration] = useAtom(fightDurationAtom);
  const [iterations, setIterations] = useAtom(iterationsAtom);
  const [targetType, setTargetType] = useAtom(targetTypeAtom);

  const selectedProfile =
    FIGHT_PROFILES.find((p) => p.id === targetType) ?? FIGHT_PROFILES[0];

  const handleSimcChange = (value: string) => {
    setSimcString(value);

    if (value.trim().length > 50) {
      setParsedData(MOCK_PARSED_DATA);
    } else {
      setParsedData(null);
    }
  };

  const handleClear = () => {
    setSimcString("");
    setParsedData(null);
  };

  const handleRunSim = () => {
    console.log("Running simulation:", {
      parsedData,
      targetType,
      fightDuration,
      iterations,
    });
  };

  // Zen state: just the paste area
  if (!parsedData) {
    return (
      <div className="mx-auto max-w-2xl">
        <Textarea
          value={simcString}
          onChange={(e) => handleSimcChange(e.target.value)}
          placeholder={`Paste your SimulationCraft export here...

shaman="Wellenwilli"
level=80
race=tauren
region=eu
server=blackmoore
spec=restoration

talents=CgQAL+iDLHPJSLC...

head=,id=212011,bonus_id=6652/10877...`}
          className="min-h-[320px] border-dashed border-2 font-mono text-sm focus:border-solid"
          autoFocus
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

  const { character, professions, gear } = parsedData;

  // Character loaded: show full equipment preview
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Character + Equipment Card */}
      <Card>
        <CardHeader>
          <CharacterSummaryCard
            character={character}
            professions={professions}
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
                item={gear[slot]}
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
                item={gear[slot]}
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
      <div className="space-y-2">
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
            className="w-[var(--radix-popover-trigger-width)] p-0"
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
      <Button size="lg" onClick={handleRunSim} className="w-full">
        <Play className="mr-2 h-4 w-4" />
        Run Simulation
      </Button>
    </div>
  );
}

function QuickSimContentSkeleton() {
  return (
    <div className="mx-auto max-w-2xl">
      <Skeleton className="h-[320px] w-full rounded-lg" />
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
