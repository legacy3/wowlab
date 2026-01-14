"use client";

import { useState } from "react";
import { ChevronLeft, Trophy, UserX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CharacterLinkButton } from "@/components/ui/character-link";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SpecPicker } from "@/components/ui/spec-picker";
import { CharacterEquipmentPanel } from "@/components/equipment";
import {
  PRESET_CHARACTERS,
  SIM_TYPE_LABELS,
  SIM_TYPES,
  type PresetCharacter,
  type SimType,
} from "./mock-data";

type SelectedSpec = {
  specId: number;
  className: string;
  specName: string;
};

function findPresetForSpec(
  className: string,
  specName: string,
): PresetCharacter | undefined {
  return PRESET_CHARACTERS.find(
    (p) => p.character.class === className && p.character.spec === specName,
  );
}

function SimTypeSelect({
  value,
  onChange,
}: {
  value: SimType;
  onChange: (value: SimType) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SimType)}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SIM_TYPES.map((simType) => (
          <SelectItem key={simType} value={simType}>
            {SIM_TYPE_LABELS[simType]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PresetCharactersSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton className="h-[200px] w-[420px] rounded-xl" />
    </div>
  );
}

export function PresetCharactersContent() {
  const [selectedSpec, setSelectedSpec] = useState<SelectedSpec | null>(null);
  const [simType, setSimType] = useState<SimType>("single-target");

  if (!selectedSpec) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Select a spec to view the top-performing character
          </p>
          <SimTypeSelect value={simType} onChange={setSimType} />
        </div>
        <div className="flex flex-col items-center">
          <SpecPicker
            onSpecSelect={(specId, className, specName) => {
              setSelectedSpec({ specId, className, specName });
            }}
          />
        </div>
      </div>
    );
  }

  const preset = findPresetForSpec(
    selectedSpec.className,
    selectedSpec.specName,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedSpec(null)}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <SimTypeSelect value={simType} onChange={setSimType} />
      </div>

      {preset ? (
        <CharacterEquipmentPanel
          character={preset.character}
          gear={preset.gear}
          stats={preset.stats}
          rightContent={
            <div className="flex items-center gap-2">
              {preset.rankings[simType] && (
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="h-3 w-3" />#{preset.rankings[simType]}{" "}
                  {SIM_TYPE_LABELS[simType]}
                </Badge>
              )}
              <CharacterLinkButton
                character={preset.character}
                variant="outline"
                size="sm"
              />
            </div>
          }
        />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserX />
            </EmptyMedia>
            <EmptyTitle>No Character Found</EmptyTitle>
            <EmptyDescription>
              No preset character is available for {selectedSpec.specName}{" "}
              {selectedSpec.className} yet. Check back later or select a
              different spec.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
