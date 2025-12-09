"use client";

import { useMemo, useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { GameIcon } from "@/components/game";
import {
  CLASS_COLORS,
  type TrendDirection,
  type WowClass,
} from "@/atoms/dps-rankings";
import { TabHeader, RankingsCard, TrendPill } from "./shared";

// Types
interface TalentNode {
  id: number;
  name: string;
  iconName: string;
  points: number;
  maxPoints: number;
}

interface TalentCombination {
  id: string;
  rank: number;
  spec: string;
  class: WowClass;
  avgDps: number;
  usagePercent: number;
  sampleSize: number;
  keyTalents: TalentNode[];
  trendDirection: TrendDirection;
  trendValue: number;
}

// Mock data
const MOCK_TALENT_COMBINATIONS: TalentCombination[] = [
  {
    id: "fury-1",
    rank: 1,
    spec: "Fury",
    class: "Warrior",
    avgDps: 4250,
    usagePercent: 34.2,
    sampleSize: 1247,
    keyTalents: [
      {
        id: 1,
        name: "Rampage",
        iconName: "ability_warrior_rampage",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 2,
        name: "Bloodthirst",
        iconName: "spell_nature_bloodlust",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 3,
        name: "Raging Blow",
        iconName: "ability_hunter_swiftstrike",
        points: 2,
        maxPoints: 2,
      },
      {
        id: 4,
        name: "Enrage",
        iconName: "spell_shadow_unholyfrenzy",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 5,
        name: "Meat Cleaver",
        iconName: "ability_whirlwind",
        points: 2,
        maxPoints: 2,
      },
    ],
    trendDirection: "up",
    trendValue: 2.3,
  },
  {
    id: "arcane-1",
    rank: 2,
    spec: "Arcane",
    class: "Mage",
    avgDps: 4180,
    usagePercent: 28.7,
    sampleSize: 892,
    keyTalents: [
      {
        id: 1,
        name: "Arcane Blast",
        iconName: "spell_arcane_blast",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 2,
        name: "Arcane Missiles",
        iconName: "spell_nature_starfall",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 3,
        name: "Arcane Power",
        iconName: "spell_nature_lightning",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 4,
        name: "Presence of Mind",
        iconName: "spell_nature_enchantarmor",
        points: 1,
        maxPoints: 1,
      },
    ],
    trendDirection: "up",
    trendValue: 1.8,
  },
  {
    id: "affliction-1",
    rank: 3,
    spec: "Affliction",
    class: "Warlock",
    avgDps: 4120,
    usagePercent: 41.5,
    sampleSize: 1456,
    keyTalents: [
      {
        id: 1,
        name: "Unstable Affliction",
        iconName: "spell_shadow_unstableaffliction_3",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 2,
        name: "Haunt",
        iconName: "ability_warlock_haunt",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 3,
        name: "Corruption",
        iconName: "spell_shadow_abominationexplosion",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 4,
        name: "Drain Soul",
        iconName: "spell_shadow_haunting",
        points: 2,
        maxPoints: 2,
      },
    ],
    trendDirection: "flat",
    trendValue: 0.2,
  },
  {
    id: "survival-1",
    rank: 4,
    spec: "Survival",
    class: "Hunter",
    avgDps: 4050,
    usagePercent: 52.3,
    sampleSize: 2103,
    keyTalents: [
      {
        id: 1,
        name: "Explosive Shot",
        iconName: "ability_hunter_explosiveshot",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 2,
        name: "Lock and Load",
        iconName: "ability_hunter_lockandload",
        points: 3,
        maxPoints: 3,
      },
      {
        id: 3,
        name: "Black Arrow",
        iconName: "spell_shadow_painspike",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 4,
        name: "Serpent Sting",
        iconName: "ability_hunter_quickshot",
        points: 1,
        maxPoints: 1,
      },
    ],
    trendDirection: "down",
    trendValue: -0.8,
  },
  {
    id: "unholy-1",
    rank: 5,
    spec: "Unholy",
    class: "Death Knight",
    avgDps: 3980,
    usagePercent: 38.9,
    sampleSize: 1678,
    keyTalents: [
      {
        id: 1,
        name: "Scourge Strike",
        iconName: "spell_deathknight_scourgestrike",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 2,
        name: "Summon Gargoyle",
        iconName: "ability_deathknight_summongargoyle",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 3,
        name: "Unholy Blight",
        iconName: "spell_shadow_contagion",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 4,
        name: "Wandering Plague",
        iconName: "spell_shadow_plaguecloud",
        points: 3,
        maxPoints: 3,
      },
    ],
    trendDirection: "up",
    trendValue: 3.1,
  },
  {
    id: "combat-1",
    rank: 6,
    spec: "Combat",
    class: "Rogue",
    avgDps: 3920,
    usagePercent: 45.1,
    sampleSize: 1834,
    keyTalents: [
      {
        id: 1,
        name: "Killing Spree",
        iconName: "ability_rogue_murderspree",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 2,
        name: "Adrenaline Rush",
        iconName: "spell_shadow_shadowworddominate",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 3,
        name: "Blade Flurry",
        iconName: "ability_warrior_punishingblow",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 4,
        name: "Savage Combat",
        iconName: "ability_creature_disease_03",
        points: 2,
        maxPoints: 2,
      },
    ],
    trendDirection: "flat",
    trendValue: 0.1,
  },
  {
    id: "balance-1",
    rank: 7,
    spec: "Balance",
    class: "Druid",
    avgDps: 3870,
    usagePercent: 31.4,
    sampleSize: 1102,
    keyTalents: [
      {
        id: 1,
        name: "Starfall",
        iconName: "ability_druid_starfall",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 2,
        name: "Eclipse",
        iconName: "ability_druid_eclipse",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 3,
        name: "Moonkin Form",
        iconName: "spell_nature_forceofnature",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 4,
        name: "Typhoon",
        iconName: "ability_druid_typhoon",
        points: 1,
        maxPoints: 1,
      },
    ],
    trendDirection: "up",
    trendValue: 1.5,
  },
  {
    id: "fire-1",
    rank: 8,
    spec: "Fire",
    class: "Mage",
    avgDps: 3820,
    usagePercent: 22.8,
    sampleSize: 756,
    keyTalents: [
      {
        id: 1,
        name: "Living Bomb",
        iconName: "ability_mage_livingbomb",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 2,
        name: "Hot Streak",
        iconName: "ability_mage_hotstreak",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 3,
        name: "Pyroblast",
        iconName: "spell_fire_fireball02",
        points: 1,
        maxPoints: 1,
      },
      {
        id: 4,
        name: "Combustion",
        iconName: "spell_fire_sealoffire",
        points: 1,
        maxPoints: 1,
      },
    ],
    trendDirection: "down",
    trendValue: -1.2,
  },
];

// Class/spec filter options
const CLASS_SPEC_OPTIONS = [
  { value: "all", label: "All Specs" },
  {
    value: "Death Knight",
    label: "Death Knight",
    specs: ["Blood", "Frost", "Unholy"],
  },
  {
    value: "Druid",
    label: "Druid",
    specs: ["Balance", "Feral", "Restoration"],
  },
  {
    value: "Hunter",
    label: "Hunter",
    specs: ["Beast Mastery", "Marksmanship", "Survival"],
  },
  { value: "Mage", label: "Mage", specs: ["Arcane", "Fire", "Frost"] },
  {
    value: "Paladin",
    label: "Paladin",
    specs: ["Holy", "Protection", "Retribution"],
  },
  { value: "Priest", label: "Priest", specs: ["Discipline", "Holy", "Shadow"] },
  {
    value: "Rogue",
    label: "Rogue",
    specs: ["Assassination", "Combat", "Subtlety"],
  },
  {
    value: "Shaman",
    label: "Shaman",
    specs: ["Elemental", "Enhancement", "Restoration"],
  },
  {
    value: "Warlock",
    label: "Warlock",
    specs: ["Affliction", "Demonology", "Destruction"],
  },
  { value: "Warrior", label: "Warrior", specs: ["Arms", "Fury", "Protection"] },
] as const;

// Talent row component
function TalentRow({ combo }: { combo: TalentCombination }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow
        className={cn(
          "cursor-pointer transition-colors",
          combo.rank <= 3 &&
            "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10/50",
          expanded && "bg-muted/50",
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="text-center font-semibold">
          {combo.rank}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CLASS_COLORS[combo.class] }}
            />
            <div className="min-w-0">
              <p className="font-medium">
                {combo.spec} {combo.class}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{combo.sampleSize.toLocaleString()} sims</span>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="flex items-center gap-1">
            {combo.keyTalents.slice(0, 4).map((talent) => (
              <div
                key={talent.id}
                className="relative h-7 w-7 overflow-hidden rounded border border-border/50"
                title={`${talent.name} (${talent.points}/${talent.maxPoints})`}
              >
                <GameIcon
                  iconName={talent.iconName}
                  size="small"
                  className="h-full w-full"
                />
                {talent.maxPoints > 1 && (
                  <span className="absolute right-0 bottom-0 bg-black/70 px-0.5 text-[9px] font-bold text-white">
                    {talent.points}
                  </span>
                )}
              </div>
            ))}
            {combo.keyTalents.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{combo.keyTalents.length - 4}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right font-medium tabular-nums">
          {combo.avgDps.toLocaleString()}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <div className="flex items-center justify-end gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${combo.usagePercent}%` }}
              />
            </div>
            <span className="w-12 text-right text-sm tabular-nums text-muted-foreground">
              {combo.usagePercent.toFixed(1)}%
            </span>
          </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell text-right tabular-nums">
          <TrendPill
            direction={combo.trendDirection}
            value={combo.trendValue}
          />
        </TableCell>
        <TableCell className="w-10 text-center">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={7} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                Key Talents
              </div>
              <div className="flex flex-wrap gap-2">
                {combo.keyTalents.map((talent) => (
                  <div
                    key={talent.id}
                    className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
                  >
                    <div className="relative h-8 w-8 overflow-hidden rounded border border-border/50">
                      <GameIcon
                        iconName={talent.iconName}
                        size="medium"
                        className="h-full w-full"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{talent.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {talent.points}/{talent.maxPoints} points
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-6 pt-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">
                    {combo.avgDps.toLocaleString()}
                  </span>{" "}
                  avg DPS
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {combo.usagePercent.toFixed(1)}%
                  </span>{" "}
                  usage rate
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {combo.sampleSize.toLocaleString()}
                  </span>{" "}
                  simulations
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function TopTalentCombinationsTab() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSpec, setSelectedSpec] = useState<string>("all");

  const classOption = CLASS_SPEC_OPTIONS.find((c) => c.value === selectedClass);
  const availableSpecs =
    classOption && "specs" in classOption ? classOption.specs : [];

  const filteredCombinations = useMemo(() => {
    return MOCK_TALENT_COMBINATIONS.filter((combo) => {
      if (selectedClass !== "all" && combo.class !== selectedClass) {
        return false;
      }
      if (selectedSpec !== "all" && combo.spec !== selectedSpec) {
        return false;
      }
      return true;
    }).map((combo, index) => ({ ...combo, rank: index + 1 }));
  }, [selectedClass, selectedSpec]);

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedSpec("all");
  };

  return (
    <div className="space-y-6">
      <TabHeader
        title="Top Talent Combinations"
        description="Most effective talent builds based on simulation data. Click a row to see talent details."
      >
        <Select value={selectedClass} onValueChange={handleClassChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            {CLASS_SPEC_OPTIONS.map((entry) => (
              <SelectItem key={entry.value} value={entry.value}>
                <div className="flex items-center gap-2">
                  {entry.value !== "all" && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: CLASS_COLORS[entry.value as WowClass],
                      }}
                    />
                  )}
                  {entry.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedClass !== "all" && availableSpecs.length > 0 && (
          <Select value={selectedSpec} onValueChange={setSelectedSpec}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by spec" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specs</SelectItem>
              {availableSpecs.map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </TabHeader>

      <RankingsCard
        footer="Talent data aggregated from public simulations. Usage % shows how often this build appears among top performers for the spec."
        totalCount={filteredCombinations.length}
        pageCount={Math.ceil(filteredCombinations.length / 8)}
        pageSize={8}
        showPagination={filteredCombinations.length > 0}
      >
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-center">#</TableHead>
                <TableHead>Spec</TableHead>
                <TableHead className="hidden md:table-cell">
                  Key Talents
                </TableHead>
                <TableHead className="text-right">Avg DPS</TableHead>
                <TableHead className="hidden sm:table-cell text-right">
                  Usage
                </TableHead>
                <TableHead className="hidden lg:table-cell text-right">
                  Trend
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCombinations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        No talent combinations found for this filter.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCombinations.map((combo) => (
                  <TalentRow key={combo.id} combo={combo} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </RankingsCard>
    </div>
  );
}
