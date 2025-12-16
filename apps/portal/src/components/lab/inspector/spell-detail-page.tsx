"use client";

import { GameIcon } from "@/components/game/game-icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Crosshair,
  Gauge,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_SPELL_AIMED_SHOT = {
  id: 19434,
  name: "Aimed Shot",
  description:
    "A powerful aimed shot that deals 248% of Attack Power as Physical damage.",
  iconName: "ability_hunter_aimedshot",
  isPassive: false,

  // Quick Stats
  castTime: 2500,
  cooldown: 12000,
  gcd: 1500,
  range: { min: 0, max: 40 },
  cost: { type: "Focus", amount: 35 },
  school: "Physical",
  dispelType: null,
  mechanic: null,
  charges: null,

  // Effects
  effects: [
    {
      index: 0,
      effectType: "SCHOOL_DAMAGE",
      effectTypeId: 2,
      auraType: null,
      basePoints: 0,
      coefficient: 2.48,
      apCoefficient: 0.0,
      variance: 0.05,
      pvpMultiplier: 1.0,
      chainTargets: 0,
      radiusMin: 0,
      radiusMax: 0,
      target: "TARGET_UNIT_TARGET_ENEMY",
      targetId: 6,
      triggerSpell: null,
      auraPeriod: null,
      duration: null,
    },
    {
      index: 1,
      effectType: "APPLY_AURA",
      effectTypeId: 6,
      auraType: "PERIODIC_DAMAGE",
      auraTypeId: 3,
      basePoints: 0,
      coefficient: 0.62,
      apCoefficient: 0.0,
      variance: 0,
      pvpMultiplier: 1.0,
      chainTargets: 0,
      radiusMin: 0,
      radiusMax: 0,
      target: "TARGET_UNIT_TARGET_ENEMY",
      targetId: 6,
      triggerSpell: null,
      auraPeriod: 2000,
      duration: 6000,
    },
  ],

  // Proc Mechanics
  procData: null,
  triggersSpells: [{ id: 378888, name: "Trick Shots" }],

  // Scaling
  scalingClass: -7,
  scalingClassName: "Hunter",
  minScalingLevel: 1,
  maxScalingLevel: 80,

  // Difficulty Overrides
  difficultyOverrides: [
    { difficulty: "Normal", difficultyId: 1, changes: null },
    { difficulty: "Heroic", difficultyId: 2, changes: null },
    { difficulty: "Mythic", difficultyId: 16, changes: null },
    {
      difficulty: "Mythic+",
      difficultyId: 8,
      changes: { pvpMultiplier: 0.85 },
    },
  ],

  // Attributes
  attributes: [
    { index: 0, value: 0x00000000, flags: [] },
    {
      index: 1,
      value: 0x00400000,
      flags: [{ name: "ATTR1_CHANNEL_TRACK_TARGET", set: true }],
    },
    { index: 2, value: 0x00000000, flags: [] },
    { index: 3, value: 0x00000000, flags: [] },
    { index: 4, value: 0x00000000, flags: [] },
    { index: 5, value: 0x00000000, flags: [] },
    { index: 6, value: 0x00000000, flags: [] },
    { index: 7, value: 0x00000000, flags: [] },
  ],

  // Spell Class Options
  spellClassSet: 9,
  spellClassSetName: "Hunter",
  spellClassMask: [0x00000001, 0x00000000, 0x00000000, 0x00000000],
  modifiedBy: [
    {
      id: 260228,
      name: "Careful Aim",
      description: "+50% crit when target >70% HP",
    },
    {
      id: 257621,
      name: "Trick Shots",
      description: "Ricochet to nearby enemies",
    },
    {
      id: 378888,
      name: "Serpentstalker's Trickery",
      description: "30% proc for aimed shot",
    },
  ],

  // Aura Restrictions
  auraRestrictions: {
    casterMustHave: [],
    casterMustNotHave: [],
    targetMustHave: [],
    targetMustNotHave: [],
  },

  // Shapeshift
  shapeshiftRequirements: {
    requiredForms: [],
    excludedForms: [],
  },

  // Labels
  labels: [
    { id: 17, name: "Shot" },
    { id: 235, name: "Marksmanship" },
    { id: 1024, name: "Focus Spender" },
  ],

  // Related Spells
  relatedSpells: {
    replaces: null as { id: number; name: string } | null,
    replacedBy: null as { id: number; name: string } | null,
    learnsOnCast: [] as { id: number; name: string }[],
    triggeredByThis: [
      { id: 378888, name: "Trick Shots Damage" },
      { id: 389879, name: "Careful Aim Buff" },
    ],
    triggersThis: [] as { id: number; name: string }[],
  },

  // Empower
  empowerData: null,

  // Raw Data
  rawData: {
    spell: { ID: 19434, Name_lang: "Aimed Shot" },
    spellMisc: { ID: 19434, CastingTimeIndex: 12, DurationIndex: 0 },
    spellEffect: [
      { ID: 123456, EffectIndex: 0, Effect: 2, SpellID: 19434 },
      { ID: 123457, EffectIndex: 1, Effect: 6, SpellID: 19434 },
    ],
  },

  // Simulation Notes
  simulationNotes: {
    baseDamageCoefficient: "2.48 * Attack Power",
    dotCoefficient: "0.62 * Attack Power over 6s (3 ticks)",
    castTimeAffectedByHaste: true,
    gcdAffectedByHaste: true,
    cooldownAffectedByHaste: false,
    canCrit: true,
    notes: [
      "Careful Aim talent increases crit by 50% when target HP > 70%",
      "Trick Shots talent causes ricochet damage to nearby targets",
      "Lock and Load talent can make this instant cast",
    ],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTime(ms: number | null): string {
  if (ms === null) return "-";
  if (ms === 0) return "Instant";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatHex(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(8, "0")}`;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function QuickStatsCard({ spell }: { spell: typeof MOCK_SPELL_AIMED_SHOT }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cast Time</p>
              <p className="font-medium">{formatTime(spell.castTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cooldown</p>
              <p className="font-medium">{formatTime(spell.cooldown)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Range</p>
              <p className="font-medium">{spell.range.max} yds</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Resource</p>
              <p className="font-medium">
                {spell.cost.amount} {spell.cost.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">GCD</p>
              <p className="font-medium">{formatTime(spell.gcd)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">School</p>
              <p className="font-medium">{spell.school}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SpellEffectsCard({ spell }: { spell: typeof MOCK_SPELL_AIMED_SHOT }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spell Effects</CardTitle>
        <CardDescription>
          Detailed breakdown of each spell effect
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {spell.effects.map((effect) => (
          <div
            key={effect.index}
            className="rounded-lg border bg-muted/30 p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline">Effect #{effect.index}</Badge>
              <span className="font-semibold">
                {effect.effectType} ({effect.effectTypeId})
              </span>
              {effect.auraType && (
                <>
                  <span className="text-muted-foreground">-</span>
                  <span className="text-muted-foreground">
                    {effect.auraType} ({effect.auraTypeId})
                  </span>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Points:</span>
                <span>{effect.basePoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coefficient (SP):</span>
                <span>{effect.coefficient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coefficient (AP):</span>
                <span>{effect.apCoefficient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Variance:</span>
                <span>{effect.variance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PvP Multiplier:</span>
                <span>{effect.pvpMultiplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chain Targets:</span>
                <span>{effect.chainTargets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Radius:</span>
                <span>
                  {effect.radiusMin} - {effect.radiusMax} yds
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target:</span>
                <span className="text-right truncate">
                  {effect.target} ({effect.targetId})
                </span>
              </div>
              {effect.auraPeriod && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aura Period:</span>
                  <span>{effect.auraPeriod}ms</span>
                </div>
              )}
              {effect.duration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{effect.duration}ms</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProcMechanicsCard({ spell }: { spell: typeof MOCK_SPELL_AIMED_SHOT }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proc Mechanics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {spell.procData ? (
          <div>Proc data here</div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No proc behavior - this is a directly cast spell
          </p>
        )}

        {spell.triggersSpells.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Triggers Spells:</h4>
            <ul className="space-y-1">
              {spell.triggersSpells.map((s) => (
                <li key={s.id} className="text-sm">
                  <Link
                    href={`/lab/inspector/spell/${s.id}`}
                    className="text-primary hover:underline"
                  >
                    #{s.id} {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScalingCard({ spell }: { spell: typeof MOCK_SPELL_AIMED_SHOT }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scaling & Difficulty</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Scaling Class</p>
            <p className="font-medium">
              {spell.scalingClassName} ({spell.scalingClass})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Scaling Level Range</p>
            <p className="font-medium">
              {spell.minScalingLevel} - {spell.maxScalingLevel}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Difficulty Overrides</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Difficulty</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spell.difficultyOverrides.map((d) => (
                <TableRow key={d.difficultyId}>
                  <TableCell>
                    {d.difficulty} ({d.difficultyId})
                  </TableCell>
                  <TableCell>
                    {d.changes ? (
                      <span className="text-yellow-500">
                        PvP Multiplier: {d.changes.pvpMultiplier}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Base values</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AttributesCard({ spell }: { spell: typeof MOCK_SPELL_AIMED_SHOT }) {
  const [expanded, setExpanded] = useState(false);
  const displayedAttributes = expanded
    ? spell.attributes
    : spell.attributes.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spell Attributes (Flags)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayedAttributes.map((attr) => (
          <div key={attr.index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Attributes[{attr.index}]:
              </span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {formatHex(attr.value)}
              </code>
            </div>
            {attr.flags.length > 0 && (
              <ul className="ml-4 text-xs space-y-0.5">
                {attr.flags.map((flag) => (
                  <li key={flag.name} className="flex items-center gap-1">
                    <span
                      className={cn(
                        "w-3 h-3 rounded-sm border flex items-center justify-center text-[8px]",
                        flag.set
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground",
                      )}
                    >
                      {flag.set && "x"}
                    </span>
                    <span className={flag.set ? "" : "text-muted-foreground"}>
                      {flag.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {spell.attributes.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary hover:underline"
          >
            {expanded
              ? "Show less"
              : `Expand all ${spell.attributes.length} attribute flags...`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function SpellClassOptionsCard({
  spell,
}: {
  spell: typeof MOCK_SPELL_AIMED_SHOT;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spell Class Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Spell Class Set</p>
            <p className="font-medium">
              {spell.spellClassSet} ({spell.spellClassSetName})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Spell Class Mask</p>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              [{spell.spellClassMask.map(formatHex).join(", ")}]
            </code>
          </div>
        </div>

        {spell.modifiedBy.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This mask is used by talents and other spells to modify this
              ability:
            </p>
            <ul className="space-y-1 text-sm">
              {spell.modifiedBy.map((mod) => (
                <li key={mod.id}>
                  <Link
                    href={`/lab/inspector/spell/${mod.id}`}
                    className="text-primary hover:underline"
                  >
                    {mod.name} (#{mod.id})
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    - {mod.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AuraRestrictionsCard({
  spell,
}: {
  spell: typeof MOCK_SPELL_AIMED_SHOT;
}) {
  const { auraRestrictions } = spell;
  const hasRestrictions =
    auraRestrictions.casterMustHave.length > 0 ||
    auraRestrictions.casterMustNotHave.length > 0 ||
    auraRestrictions.targetMustHave.length > 0 ||
    auraRestrictions.targetMustNotHave.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aura Restrictions</CardTitle>
      </CardHeader>
      <CardContent>
        {hasRestrictions ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Caster Must Have:</p>
              <p className="text-muted-foreground">
                {auraRestrictions.casterMustHave.length > 0
                  ? auraRestrictions.casterMustHave.join(", ")
                  : "(none)"}
              </p>
            </div>
            <div>
              <p className="font-medium">Caster Must NOT Have:</p>
              <p className="text-muted-foreground">
                {auraRestrictions.casterMustNotHave.length > 0
                  ? auraRestrictions.casterMustNotHave.join(", ")
                  : "(none)"}
              </p>
            </div>
            <div>
              <p className="font-medium">Target Must Have:</p>
              <p className="text-muted-foreground">
                {auraRestrictions.targetMustHave.length > 0
                  ? auraRestrictions.targetMustHave.join(", ")
                  : "(none)"}
              </p>
            </div>
            <div>
              <p className="font-medium">Target Must NOT Have:</p>
              <p className="text-muted-foreground">
                {auraRestrictions.targetMustNotHave.length > 0
                  ? auraRestrictions.targetMustNotHave.join(", ")
                  : "(none)"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No aura restrictions for this spell.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ShapeshiftCard({ spell }: { spell: typeof MOCK_SPELL_AIMED_SHOT }) {
  const { shapeshiftRequirements } = spell;
  const hasRequirements =
    shapeshiftRequirements.requiredForms.length > 0 ||
    shapeshiftRequirements.excludedForms.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shapeshift Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        {hasRequirements ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Required Forms:</p>
              <p className="text-muted-foreground">
                {shapeshiftRequirements.requiredForms.length > 0
                  ? shapeshiftRequirements.requiredForms.join(", ")
                  : "None (usable in any form)"}
              </p>
            </div>
            <div>
              <p className="font-medium">Excluded Forms:</p>
              <p className="text-muted-foreground">
                {shapeshiftRequirements.excludedForms.length > 0
                  ? shapeshiftRequirements.excludedForms.join(", ")
                  : "None"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No shapeshift requirements. Usable in any form.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LabelsCard({ spell }: { spell: typeof MOCK_SPELL_AIMED_SHOT }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spell Labels</CardTitle>
        <CardDescription>
          Labels are used by talents/effects to target groups of spells.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {spell.labels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {spell.labels.map((label) => (
              <Badge key={label.id} variant="secondary">
                {label.id}: {label.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No labels assigned to this spell.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RelatedSpellsCard({ spell }: { spell: typeof MOCK_SPELL_AIMED_SHOT }) {
  const { relatedSpells } = spell;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Spells</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Replaces:</p>
            <p className="text-muted-foreground">
              {relatedSpells.replaces ? (
                <Link
                  href={`/lab/inspector/spell/${relatedSpells.replaces.id}`}
                  className="text-primary hover:underline"
                >
                  #{relatedSpells.replaces.id} {relatedSpells.replaces.name}
                </Link>
              ) : (
                "-"
              )}
            </p>
          </div>
          <div>
            <p className="font-medium">Replaced By:</p>
            <p className="text-muted-foreground">
              {relatedSpells.replacedBy ? (
                <Link
                  href={`/lab/inspector/spell/${relatedSpells.replacedBy.id}`}
                  className="text-primary hover:underline"
                >
                  #{relatedSpells.replacedBy.id} {relatedSpells.replacedBy.name}
                </Link>
              ) : (
                "-"
              )}
            </p>
          </div>
        </div>

        <div>
          <p className="font-medium">Triggered By This Spell:</p>
          {relatedSpells.triggeredByThis.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {relatedSpells.triggeredByThis.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/lab/inspector/spell/${s.id}`}
                    className="text-primary hover:underline"
                  >
                    #{s.id} {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">(none)</p>
          )}
        </div>

        <div>
          <p className="font-medium">Triggers This Spell:</p>
          {relatedSpells.triggersThis.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {relatedSpells.triggersThis.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/lab/inspector/spell/${s.id}`}
                    className="text-primary hover:underline"
                  >
                    #{s.id} {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              #{spell.id} is directly cast (not triggered)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmpowerCard({ spell }: { spell: typeof MOCK_SPELL_AIMED_SHOT }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Empower Data</CardTitle>
      </CardHeader>
      <CardContent>
        {spell.empowerData ? (
          <div>Empower data here</div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Not an empowered spell.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RawDataCard({ spell }: { spell: typeof MOCK_SPELL_AIMED_SHOT }) {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const sections = [
    { key: "spell", label: "Spell.csv row", data: spell.rawData.spell },
    {
      key: "spellMisc",
      label: "SpellMisc.csv row",
      data: spell.rawData.spellMisc,
    },
    {
      key: "spellEffect",
      label: `SpellEffect.csv rows (${spell.rawData.spellEffect.length})`,
      data: spell.rawData.spellEffect,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Data Inspector</CardTitle>
        <CardDescription>Collapsible sections for raw CSV data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sections.map((section) => (
          <Collapsible
            key={section.key}
            open={openSections.includes(section.key)}
            onOpenChange={() => toggleSection(section.key)}
          >
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50">
              {openSections.includes(section.key) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {section.label}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {JSON.stringify(section.data, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}

function SimulationNotesCard({
  spell,
}: {
  spell: typeof MOCK_SPELL_AIMED_SHOT;
}) {
  const { simulationNotes } = spell;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Notes</CardTitle>
        <CardDescription>Key values for simulation purposes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Base Damage Coefficient:</p>
            <p className="font-mono">{simulationNotes.baseDamageCoefficient}</p>
          </div>
          <div>
            <p className="text-muted-foreground">DoT Coefficient:</p>
            <p className="font-mono">{simulationNotes.dotCoefficient}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Cast time affected by haste:
            </span>
            <span>
              {simulationNotes.castTimeAffectedByHaste ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              GCD affected by haste:
            </span>
            <span>{simulationNotes.gcdAffectedByHaste ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Cooldown affected by haste:
            </span>
            <span>
              {simulationNotes.cooldownAffectedByHaste ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Can crit:</span>
            <span>{simulationNotes.canCrit ? "Yes" : "No"}</span>
          </div>
        </div>

        {simulationNotes.notes.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Notes:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
              {simulationNotes.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface SpellDetailPageProps {
  spellId: string;
}

export function SpellDetailPage({ spellId }: SpellDetailPageProps) {
  // In a real implementation, we would fetch data based on spellId
  // For now, we use mock data
  const spell = MOCK_SPELL_AIMED_SHOT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 overflow-hidden rounded-lg border-2 border-border">
              <GameIcon iconName={spell.iconName} size="large" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{spell.name}</h1>
                <Badge variant="outline">Spell #{spell.id}</Badge>
                {spell.isPassive && <Badge variant="secondary">Passive</Badge>}
              </div>
              <p className="mt-2 text-muted-foreground">{spell.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <QuickStatsCard spell={spell} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SpellEffectsCard spell={spell} />
        <div className="space-y-6">
          <ProcMechanicsCard spell={spell} />
          <ScalingCard spell={spell} />
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <AttributesCard spell={spell} />
        <SpellClassOptionsCard spell={spell} />
      </div>

      {/* Restrictions */}
      <div className="grid gap-6 md:grid-cols-2">
        <AuraRestrictionsCard spell={spell} />
        <ShapeshiftCard spell={spell} />
      </div>

      {/* Labels and Related */}
      <div className="grid gap-6 md:grid-cols-2">
        <LabelsCard spell={spell} />
        <EmpowerCard spell={spell} />
      </div>

      {/* Related Spells */}
      <RelatedSpellsCard spell={spell} />

      {/* Raw Data & Simulation */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RawDataCard spell={spell} />
        <SimulationNotesCard spell={spell} />
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function SpellDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
