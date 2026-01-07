"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CLASS_COLORS_BY_ID } from "@/lib/colors";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type WowClass =
  | "warrior"
  | "paladin"
  | "hunter"
  | "rogue"
  | "priest"
  | "shaman"
  | "mage"
  | "warlock"
  | "monk"
  | "druid"
  | "demon-hunter"
  | "death-knight"
  | "evoker";

export interface WowSpec {
  class: WowClass;
  spec: string;
  label: string;
}

export interface SpecSelectorValue {
  class: WowClass;
  spec: WowSpec;
}

export interface SpecSelectorProps {
  value: SpecSelectorValue | null;
  onChange: (value: SpecSelectorValue | null) => void;
  className?: string;
  disabled?: boolean;
}

// -----------------------------------------------------------------------------
// Class Data
// -----------------------------------------------------------------------------

export interface ClassDefinition {
  id: WowClass;
  label: string;
  specs: Array<{ id: string; label: string }>;
}

/** Get the class color from the shared colors definition */
export function getClassColor(classId: WowClass): string {
  return CLASS_COLORS_BY_ID[classId] ?? "#6B7280";
}

export const WOW_CLASSES: ClassDefinition[] = [
  {
    id: "warrior",
    label: "Warrior",
    specs: [
      { id: "arms", label: "Arms" },
      { id: "fury", label: "Fury" },
      { id: "protection", label: "Protection" },
    ],
  },
  {
    id: "paladin",
    label: "Paladin",
    specs: [
      { id: "holy", label: "Holy" },
      { id: "protection", label: "Protection" },
      { id: "retribution", label: "Retribution" },
    ],
  },
  {
    id: "hunter",
    label: "Hunter",
    specs: [
      { id: "beast-mastery", label: "Beast Mastery" },
      { id: "marksmanship", label: "Marksmanship" },
      { id: "survival", label: "Survival" },
    ],
  },
  {
    id: "rogue",
    label: "Rogue",
    specs: [
      { id: "assassination", label: "Assassination" },
      { id: "outlaw", label: "Outlaw" },
      { id: "subtlety", label: "Subtlety" },
    ],
  },
  {
    id: "priest",
    label: "Priest",
    specs: [
      { id: "discipline", label: "Discipline" },
      { id: "holy", label: "Holy" },
      { id: "shadow", label: "Shadow" },
    ],
  },
  {
    id: "shaman",
    label: "Shaman",
    specs: [
      { id: "elemental", label: "Elemental" },
      { id: "enhancement", label: "Enhancement" },
      { id: "restoration", label: "Restoration" },
    ],
  },
  {
    id: "mage",
    label: "Mage",
    specs: [
      { id: "arcane", label: "Arcane" },
      { id: "fire", label: "Fire" },
      { id: "frost", label: "Frost" },
    ],
  },
  {
    id: "warlock",
    label: "Warlock",
    specs: [
      { id: "affliction", label: "Affliction" },
      { id: "demonology", label: "Demonology" },
      { id: "destruction", label: "Destruction" },
    ],
  },
  {
    id: "monk",
    label: "Monk",
    specs: [
      { id: "brewmaster", label: "Brewmaster" },
      { id: "mistweaver", label: "Mistweaver" },
      { id: "windwalker", label: "Windwalker" },
    ],
  },
  {
    id: "druid",
    label: "Druid",
    specs: [
      { id: "balance", label: "Balance" },
      { id: "feral", label: "Feral" },
      { id: "guardian", label: "Guardian" },
      { id: "restoration", label: "Restoration" },
    ],
  },
  {
    id: "demon-hunter",
    label: "Demon Hunter",
    specs: [
      { id: "havoc", label: "Havoc" },
      { id: "vengeance", label: "Vengeance" },
    ],
  },
  {
    id: "death-knight",
    label: "Death Knight",
    specs: [
      { id: "blood", label: "Blood" },
      { id: "frost", label: "Frost" },
      { id: "unholy", label: "Unholy" },
    ],
  },
  {
    id: "evoker",
    label: "Evoker",
    specs: [
      { id: "devastation", label: "Devastation" },
      { id: "preservation", label: "Preservation" },
      { id: "augmentation", label: "Augmentation" },
    ],
  },
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getClassById(classId: WowClass): ClassDefinition | undefined {
  return WOW_CLASSES.find((c) => c.id === classId);
}

function getClassInitial(classId: WowClass): string {
  const cls = getClassById(classId);
  if (!cls) return "?";
  // Handle multi-word class names
  if (classId === "demon-hunter") return "DH";
  if (classId === "death-knight") return "DK";
  return cls.label.charAt(0).toUpperCase();
}

// -----------------------------------------------------------------------------
// ClassBadge Component
// -----------------------------------------------------------------------------

interface ClassBadgeProps {
  classId: WowClass | null;
  size?: "sm" | "md";
  className?: string;
}

function ClassBadge({ classId, size = "md", className }: ClassBadgeProps) {
  const initial = classId ? getClassInitial(classId) : "?";
  const bgColor = classId ? getClassColor(classId) : "#6B7280";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md font-bold text-black shrink-0",
        size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm",
        className,
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initial}
    </div>
  );
}

// -----------------------------------------------------------------------------
// SpecSelector Component
// -----------------------------------------------------------------------------

export function SpecSelector({
  value,
  onChange,
  className,
  disabled = false,
}: SpecSelectorProps) {
  const selectedClass = value?.class ?? null;
  const selectedSpec = value?.spec ?? null;
  const classData = selectedClass ? getClassById(selectedClass) : null;

  const handleClassChange = (newClassId: string) => {
    const classId = newClassId as WowClass;
    const cls = getClassById(classId);
    if (!cls) return;

    // Auto-select first spec when class changes
    const firstSpec = cls.specs[0];
    if (firstSpec) {
      onChange({
        class: classId,
        spec: {
          class: classId,
          spec: firstSpec.id,
          label: firstSpec.label,
        },
      });
    }
  };

  const handleSpecChange = (specId: string) => {
    if (!selectedClass || !classData) return;

    const specDef = classData.specs.find((s) => s.id === specId);
    if (!specDef) return;

    onChange({
      class: selectedClass,
      spec: {
        class: selectedClass,
        spec: specDef.id,
        label: specDef.label,
      },
    });
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      {/* Class Badge */}
      <ClassBadge classId={selectedClass} />

      {/* Class Selector */}
      <Select
        value={selectedClass ?? ""}
        onValueChange={handleClassChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[140px]" size="sm">
          <SelectValue placeholder="Select class" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Classes</SelectLabel>
            {WOW_CLASSES.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: getClassColor(cls.id) }}
                  />
                  {cls.label}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Spec Selector */}
      <Select
        value={selectedSpec?.spec ?? ""}
        onValueChange={handleSpecChange}
        disabled={disabled || !selectedClass}
      >
        <SelectTrigger className="w-[160px]" size="sm">
          <SelectValue placeholder={selectedClass ? "Select spec" : "---"} />
        </SelectTrigger>
        <SelectContent>
          {classData && (
            <SelectGroup>
              <SelectLabel>{classData.label} Specs</SelectLabel>
              {classData.specs.map((spec) => (
                <SelectItem key={spec.id} value={spec.id}>
                  {spec.label}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Compact Variant
// -----------------------------------------------------------------------------

export interface SpecSelectorCompactProps {
  value: SpecSelectorValue | null;
  onChange: (value: SpecSelectorValue | null) => void;
  className?: string;
  disabled?: boolean;
}

export function SpecSelectorCompact({
  value,
  onChange,
  className,
  disabled = false,
}: SpecSelectorCompactProps) {
  const selectedClass = value?.class ?? null;
  const selectedSpec = value?.spec ?? null;
  const classData = selectedClass ? getClassById(selectedClass) : null;

  const handleClassChange = (newClassId: string) => {
    const classId = newClassId as WowClass;
    const cls = getClassById(classId);
    if (!cls) return;

    const firstSpec = cls.specs[0];
    if (firstSpec) {
      onChange({
        class: classId,
        spec: {
          class: classId,
          spec: firstSpec.id,
          label: firstSpec.label,
        },
      });
    }
  };

  const handleSpecChange = (specId: string) => {
    if (!selectedClass || !classData) return;

    const specDef = classData.specs.find((s) => s.id === specId);
    if (!specDef) return;

    onChange({
      class: selectedClass,
      spec: {
        class: selectedClass,
        spec: specDef.id,
        label: specDef.label,
      },
    });
  };

  // Combined value display
  const displayValue = selectedSpec
    ? `${classData?.label} - ${selectedSpec.label}`
    : null;

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <ClassBadge classId={selectedClass} size="sm" />

      <div className="flex items-center gap-1">
        <Select
          value={selectedClass ?? ""}
          onValueChange={handleClassChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-7 w-[110px] text-xs" size="sm">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            {WOW_CLASSES.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: getClassColor(cls.id) }}
                  />
                  {cls.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground">/</span>

        <Select
          value={selectedSpec?.spec ?? ""}
          onValueChange={handleSpecChange}
          disabled={disabled || !selectedClass}
        >
          <SelectTrigger className="h-7 w-[120px] text-xs" size="sm">
            <SelectValue placeholder="Spec" />
          </SelectTrigger>
          <SelectContent>
            {classData?.specs.map((spec) => (
              <SelectItem key={spec.id} value={spec.id}>
                {spec.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Utilities for External Use
// -----------------------------------------------------------------------------

export { getClassById, getClassInitial };
