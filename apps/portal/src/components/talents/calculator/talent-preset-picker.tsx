"use client";

import { useState, useMemo } from "react";
import { BookMarked, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GameIcon } from "@/components/game";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface TalentPreset {
  id: string;
  name: string;
  specId: number;
  specName: string;
  className: string;
  classSlug: string;
  talentString: string;
  source?: string;
  description?: string;
}

// Mock data for talent presets
const MOCK_PRESETS: TalentPreset[] = [
  // Death Knight
  {
    id: "dk-blood-raid",
    name: "Blood Raid Tank",
    specId: 250,
    specName: "Blood",
    className: "Death Knight",
    classSlug: "deathknight",
    talentString: "BYQAAAAAAAAAAAAAAAAAAAAAAAAAgCAIJJJCIhkESSkkISkIE",
    source: "Wowhead",
    description: "Standard raid tanking build",
  },
  {
    id: "dk-frost-st",
    name: "Frost Single Target",
    specId: 251,
    specName: "Frost",
    className: "Death Knight",
    classSlug: "deathknight",
    talentString: "BYQAAAAAAAAAAAAAAAAAAAAAAAAAgCAIJJJCIhkESSkkISkIE",
    source: "Icy Veins",
    description: "Maximum single target damage",
  },
  {
    id: "dk-unholy-aoe",
    name: "Unholy AoE",
    specId: 252,
    specName: "Unholy",
    className: "Death Knight",
    classSlug: "deathknight",
    talentString: "BYQAAAAAAAAAAAAAAAAAAAAAAAAAgCAIJJJCIhkESSkkISkIE",
    source: "Archon",
    description: "Mythic+ dungeon build",
  },

  // Druid
  {
    id: "druid-balance-st",
    name: "Balance Single Target",
    specId: 102,
    specName: "Balance",
    className: "Druid",
    classSlug: "druid",
    talentString: "BYGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgCAIJJJCIhkE",
    source: "Wowhead",
    description: "Raid boss damage build",
  },
  {
    id: "druid-feral-bleed",
    name: "Feral Bleed Build",
    specId: 103,
    specName: "Feral",
    className: "Druid",
    classSlug: "druid",
    talentString: "BYGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgCAIJJJCIhkE",
    source: "Icy Veins",
    description: "Maximize bleed damage",
  },
  {
    id: "druid-resto-raid",
    name: "Restoration Raid",
    specId: 105,
    specName: "Restoration",
    className: "Druid",
    classSlug: "druid",
    talentString: "BYGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgCAIJJJCIhkE",
    source: "Wowhead",
    description: "HoT-focused raid healing",
  },

  // Mage
  {
    id: "mage-fire-combust",
    name: "Fire Combustion",
    specId: 63,
    specName: "Fire",
    className: "Mage",
    classSlug: "mage",
    talentString: "BIQAAAAAAAAAAAAAAAAAAAAAAAAIJJRSSECSJJhkkkkIJRkIE",
    source: "Archon",
    description: "Burst combustion windows",
  },
  {
    id: "mage-frost-shatter",
    name: "Frost Shatter",
    specId: 64,
    specName: "Frost",
    className: "Mage",
    classSlug: "mage",
    talentString: "BIQAAAAAAAAAAAAAAAAAAAAAAAAIJJRSSECSJJhkkkkIJRkIE",
    source: "Icy Veins",
    description: "Ice Lance shatter build",
  },
  {
    id: "mage-arcane-mplus",
    name: "Arcane M+",
    specId: 62,
    specName: "Arcane",
    className: "Mage",
    classSlug: "mage",
    talentString: "BIQAAAAAAAAAAAAAAAAAAAAAAAAIJJRSSECSJJhkkkkIJRkIE",
    source: "Archon",
    description: "Mythic+ dungeon build",
  },

  // Warrior
  {
    id: "warrior-arms-raid",
    name: "Arms Raid DPS",
    specId: 71,
    specName: "Arms",
    className: "Warrior",
    classSlug: "warrior",
    talentString: "BEkAAAAAAAAAAAAAAAAAAAAAAAAAAJJJJIJRSkkEJJJhkkIJRA",
    source: "Wowhead",
    description: "Execute phase specialist",
  },
  {
    id: "warrior-fury-st",
    name: "Fury Single Target",
    specId: 72,
    specName: "Fury",
    className: "Warrior",
    classSlug: "warrior",
    talentString: "BEkAAAAAAAAAAAAAAAAAAAAAAAAAAJJJJIJRSkkEJJJhkkIJRA",
    source: "Icy Veins",
    description: "Sustained damage build",
  },
  {
    id: "warrior-prot-mplus",
    name: "Protection M+",
    specId: 73,
    specName: "Protection",
    className: "Warrior",
    classSlug: "warrior",
    talentString: "BEkAAAAAAAAAAAAAAAAAAAAAAAAAAJJJJIJRSkkEJJJhkkIJRA",
    source: "Archon",
    description: "High key tanking",
  },

  // Paladin
  {
    id: "paladin-holy-raid",
    name: "Holy Raid Healer",
    specId: 65,
    specName: "Holy",
    className: "Paladin",
    classSlug: "paladin",
    talentString: "BcQAAAAAAAAAAAAAAAAAAAAAAAAQSSSkEJJJJkkEJJJSkkIJRA",
    source: "Wowhead",
    description: "Beacon-focused healing",
  },
  {
    id: "paladin-ret-st",
    name: "Retribution ST",
    specId: 70,
    specName: "Retribution",
    className: "Paladin",
    classSlug: "paladin",
    talentString: "BcQAAAAAAAAAAAAAAAAAAAAAAAAQSSSkEJJJJkkEJJJSkkIJRA",
    source: "Archon",
    description: "Single target burst",
  },

  // Rogue
  {
    id: "rogue-assassination-poison",
    name: "Assassination Poison",
    specId: 259,
    specName: "Assassination",
    className: "Rogue",
    classSlug: "rogue",
    talentString: "BUQAAAAAAAAAAAAAAAAAAAAAAAAIJJJJJgkEJJSSSkkIJJRkIA",
    source: "Icy Veins",
    description: "Poison damage focused",
  },
  {
    id: "rogue-outlaw-mplus",
    name: "Outlaw M+",
    specId: 260,
    specName: "Outlaw",
    className: "Rogue",
    classSlug: "rogue",
    talentString: "BUQAAAAAAAAAAAAAAAAAAAAAAAAIJJJJJgkEJJSSSkkIJJRkIA",
    source: "Archon",
    description: "AoE cleave build",
  },
  {
    id: "rogue-sub-raid",
    name: "Subtlety Raid",
    specId: 261,
    specName: "Subtlety",
    className: "Rogue",
    classSlug: "rogue",
    talentString: "BUQAAAAAAAAAAAAAAAAAAAAAAAAIJJJJJgkEJJSSSkkIJJRkIA",
    source: "Wowhead",
    description: "Shadow dance windows",
  },
];

interface TalentPresetPickerProps {
  currentSpecId: number | null;
  onPresetSelect: (talentString: string) => void;
}

export function TalentPresetPicker({
  currentSpecId,
  onPresetSelect,
}: TalentPresetPickerProps) {
  const [open, setOpen] = useState(false);

  const groupedPresets = useMemo(() => {
    const groups: Record<string, TalentPreset[]> = {};
    const sortedPresets = [...MOCK_PRESETS].sort((a, b) => {
      if (currentSpecId) {
        if (a.specId === currentSpecId && b.specId !== currentSpecId) {
          return -1;
        }

        if (b.specId === currentSpecId && a.specId !== currentSpecId) {
          return 1;
        }
      }

      return a.className.localeCompare(b.className);
    });

    for (const preset of sortedPresets) {
      const key = `${preset.className} - ${preset.specName}`;
      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(preset);
    }

    return groups;
  }, [currentSpecId]);

  const handleSelect = (preset: TalentPreset) => {
    onPresetSelect(preset.talentString);
    setOpen(false);

    // TODO Improve this message and make everything DRY
    toast.success(`Loaded "${preset.name}"`, {
      description: `${preset.className} ${preset.specName}${preset.source ? ` • ${preset.source}` : ""}`,
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        title="Load Preset"
      >
        <BookMarked className="h-4 w-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Load Talent Preset"
        description="Search and select a talent preset to load"
      >
        <CommandInput placeholder="Search presets ..." />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>No presets found.</CommandEmpty>
          {Object.entries(groupedPresets).map(([group, presets]) => (
            <CommandGroup key={group} heading={group}>
              {presets.map((preset) => (
                <CommandItem
                  key={preset.id}
                  value={`${preset.name} ${preset.className} ${preset.specName} ${preset.source}`}
                  onSelect={() => handleSelect(preset)}
                  className="flex items-center gap-3 py-2"
                >
                  <GameIcon
                    iconName={`class_${preset.classSlug}`}
                    size="small"
                    alt={preset.className}
                    className="h-6 w-6 shrink-0"
                  />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {preset.name}
                      </span>
                      {preset.source && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {preset.source}
                        </span>
                      )}
                    </div>
                    {preset.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {preset.description}
                      </span>
                    )}
                  </div>
                  {currentSpecId === preset.specId && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
