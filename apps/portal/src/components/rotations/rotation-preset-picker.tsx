"use client";

import { BookMarkedIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { css } from "styled-system/css";
import { HStack, VStack } from "styled-system/jsx";

import { GameIcon } from "@/components/game";
import { Button, Command, Text } from "@/components/ui";
import { useClassesAndSpecs } from "@/lib/state";

// =============================================================================
// Types
// =============================================================================

interface RotationPreset {
  className: string;
  description?: string;
  id: string;
  name: string;
  specId: number;
  specName: string;
}

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_PRESETS: RotationPreset[] = [
  // Death Knight
  {
    className: "Death Knight",
    description: "Standard raid tanking rotation",
    id: "dk-blood-raid",
    name: "Blood Raid Tank",
    specId: 250,
    specName: "Blood",
  },
  {
    className: "Death Knight",
    description: "Maximum single target damage",
    id: "dk-frost-st",
    name: "Frost Single Target",
    specId: 251,
    specName: "Frost",
  },
  {
    className: "Death Knight",
    description: "Mythic+ dungeon rotation",
    id: "dk-unholy-aoe",
    name: "Unholy AoE",
    specId: 252,
    specName: "Unholy",
  },

  // Druid
  {
    className: "Druid",
    description: "Raid boss damage rotation",
    id: "druid-balance-st",
    name: "Balance Single Target",
    specId: 102,
    specName: "Balance",
  },
  {
    className: "Druid",
    description: "Maximize bleed damage",
    id: "druid-feral-bleed",
    name: "Feral Bleed Build",
    specId: 103,
    specName: "Feral",
  },

  // Hunter
  {
    className: "Hunter",
    description: "Raid single target rotation",
    id: "hunter-bm-st",
    name: "BM Single Target",
    specId: 253,
    specName: "Beast Mastery",
  },
  {
    className: "Hunter",
    description: "Multi-target rotation",
    id: "hunter-bm-aoe",
    name: "BM AoE",
    specId: 253,
    specName: "Beast Mastery",
  },
  {
    className: "Hunter",
    description: "Aimed Shot focused rotation",
    id: "hunter-mm-st",
    name: "MM Single Target",
    specId: 254,
    specName: "Marksmanship",
  },

  // Mage
  {
    className: "Mage",
    description: "Burst combustion windows",
    id: "mage-fire-combust",
    name: "Fire Combustion",
    specId: 63,
    specName: "Fire",
  },
  {
    className: "Mage",
    description: "Ice Lance shatter rotation",
    id: "mage-frost-shatter",
    name: "Frost Shatter",
    specId: 64,
    specName: "Frost",
  },
  {
    className: "Mage",
    description: "Mythic+ dungeon rotation",
    id: "mage-arcane-mplus",
    name: "Arcane M+",
    specId: 62,
    specName: "Arcane",
  },

  // Warrior
  {
    className: "Warrior",
    description: "Execute phase specialist",
    id: "warrior-arms-raid",
    name: "Arms Raid DPS",
    specId: 71,
    specName: "Arms",
  },
  {
    className: "Warrior",
    description: "Sustained damage rotation",
    id: "warrior-fury-st",
    name: "Fury Single Target",
    specId: 72,
    specName: "Fury",
  },
  {
    className: "Warrior",
    description: "High key tanking rotation",
    id: "warrior-prot-mplus",
    name: "Protection M+",
    specId: 73,
    specName: "Protection",
  },

  // Paladin
  {
    className: "Paladin",
    description: "Single target burst rotation",
    id: "paladin-ret-st",
    name: "Retribution ST",
    specId: 70,
    specName: "Retribution",
  },

  // Rogue
  {
    className: "Rogue",
    description: "Poison damage focused",
    id: "rogue-assassination-poison",
    name: "Assassination Poison",
    specId: 259,
    specName: "Assassination",
  },
  {
    className: "Rogue",
    description: "AoE cleave rotation",
    id: "rogue-outlaw-mplus",
    name: "Outlaw M+",
    specId: 260,
    specName: "Outlaw",
  },
];

// =============================================================================
// Component
// =============================================================================

export interface RotationPresetPickerProps {
  onSelect: (preset: { specId: number; name: string }) => void;
}

export function RotationPresetPicker({ onSelect }: RotationPresetPickerProps) {
  const [open, setOpen] = useState(false);
  const { getSpecIcon } = useClassesAndSpecs();

  const groupedPresets = useMemo(() => {
    const groups: Record<string, RotationPreset[]> = {};
    const sorted = [...MOCK_PRESETS].sort((a, b) =>
      a.className.localeCompare(b.className),
    );

    for (const preset of sorted) {
      const key = `${preset.className} - ${preset.specName}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(preset);
    }

    return groups;
  }, []);

  const handleSelect = (preset: RotationPreset) => {
    onSelect({ name: preset.name, specId: preset.specId });
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <BookMarkedIcon size={16} />
        Browse Templates
      </Button>

      <Command.Dialog
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        title="Load Rotation Template"
        description="Search and select a rotation template"
      >
        <Command.Input placeholder="Search templates..." />
        <Command.List className={css({ maxH: "400px" })}>
          <Command.Empty>No templates found.</Command.Empty>
          {Object.entries(groupedPresets).map(([group, presets]) => (
            <Command.Group key={group} heading={group}>
              {presets.map((preset) => (
                <Command.Item
                  key={preset.id}
                  value={`${preset.name} ${preset.className} ${preset.specName}`}
                  onSelect={() => handleSelect(preset)}
                >
                  <GameIcon iconName={getSpecIcon(preset.specId)} size="sm" />
                  <VStack gap="0" alignItems="flex-start" flex="1" minW="0">
                    <Text fontWeight="medium" lineClamp={1}>
                      {preset.name}
                    </Text>
                    {preset.description && (
                      <Text textStyle="xs" color="fg.muted" lineClamp={1}>
                        {preset.description}
                      </Text>
                    )}
                  </VStack>
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command.Dialog>
    </>
  );
}
