"use client";

import { useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Check, ChevronsUpDown, Sparkles, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  selectedRotationIdAtom,
  isRotationAutoDetectedAtom,
  setRotationIdAtom,
} from "@/atoms/sim";
import { parsedCharacterAtom } from "@/atoms/sim/character";
import { useMyRotations, useCommunityRotations } from "@/hooks/rotations";
import { useClassesAndSpecs } from "@/hooks/use-classes-and-specs";
import { SpecLabel } from "@/components/ui/spec-label";

export function RotationPicker() {
  const [open, setOpen] = useState(false);
  const selectedId = useAtomValue(selectedRotationIdAtom);
  const parsedData = useAtomValue(parsedCharacterAtom);
  const isAutoDetected = useAtomValue(isRotationAutoDetectedAtom);
  const [, setRotationId] = useAtom(setRotationIdAtom);

  const wowClass = parsedData?.character.class;
  const spec = parsedData?.character.spec;
  const { classes, specs } = useClassesAndSpecs();

  const specId = useMemo(() => {
    if (!wowClass || !spec) {
      return undefined;
    }

    const classEntry = (classes.result?.data ?? []).find(
      (cls) => cls.Name_lang?.toLowerCase() === wowClass.toLowerCase(),
    );

    const specEntry = (specs.result?.data ?? []).find(
      (specEntry) =>
        specEntry.Name_lang?.toLowerCase() === spec.toLowerCase() &&
        specEntry.ClassID === classEntry?.ID,
    );

    return specEntry?.ID;
  }, [wowClass, spec, classes.result?.data, specs.result?.data]);

  // Fetch database rotations
  const { result: myRotationsResult } = useMyRotations({ specId });
  const { result: communityResult } = useCommunityRotations({ specId });

  const myRotations = myRotationsResult?.data ?? [];
  const communityRotations = communityResult?.data ?? [];

  const specLabelById = useMemo(() => {
    const classNameById = new Map(
      (classes.result?.data ?? []).map((cls) => [cls.ID, cls.Name_lang ?? ""]),
    );
    return new Map(
      (specs.result?.data ?? []).map((specEntry) => [
        specEntry.ID,
        `${classNameById.get(specEntry.ClassID) ?? ""} ${specEntry.Name_lang ?? ""}`.trim(),
      ]),
    );
  }, [classes.result?.data, specs.result?.data]);

  // Find selected rotation for display
  const selectedRotation =
    myRotations.find((r) => r.id === selectedId) ??
    communityRotations.find((r) => r.id === selectedId);

  const hasAnyRotation =
    myRotations.length > 0 || communityRotations.length > 0;

  const handleSelect = (rotationId: string) => {
    if (selectedId === rotationId) {
      setRotationId(null); // Toggle off
    } else {
      setRotationId(rotationId);
    }
    setOpen(false);
  };

  const handleResetToAuto = () => {
    setRotationId(null);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Rotation</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto py-3"
          >
            <div className="text-left">
              {selectedRotation ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedRotation.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {specLabelById.get(selectedRotation.specId) ? (
                      <SpecLabel
                        specId={selectedRotation.specId}
                        size="sm"
                        showIcon={false}
                      />
                    ) : (
                      "Unknown spec"
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">
                      {hasAnyRotation ? "Auto-detect" : "No rotation available"}
                    </span>
                    {isAutoDetected && hasAnyRotation && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <Sparkles className="h-2.5 w-2.5" />
                        Auto
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hasAnyRotation
                      ? "Based on character class and spec"
                      : "No rotations for this class yet"}
                  </div>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search rotations ..." />
            <CommandList>
              <CommandEmpty>No rotation found.</CommandEmpty>

              {!isAutoDetected && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleResetToAuto}
                    className="flex items-center gap-2 py-3"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-medium">Auto-detect rotation</span>
                      <span className="text-xs text-muted-foreground">
                        Based on character class and spec
                      </span>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}

              {myRotations.length > 0 && (
                <CommandGroup heading="My Rotations">
                  {myRotations.map((rotation) => (
                    <CommandItem
                      key={rotation.id}
                      value={`my ${specLabelById.get(rotation.specId) ?? ""} ${rotation.name}`}
                      onSelect={() => handleSelect(rotation.id)}
                      className="flex items-center gap-2 py-3"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{rotation.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {specLabelById.get(rotation.specId) ? (
                            <SpecLabel
                              specId={rotation.specId}
                              size="sm"
                              showIcon={false}
                            />
                          ) : (
                            "Unknown spec"
                          )}
                        </span>
                      </div>
                      {selectedId === rotation.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {communityRotations.length > 0 && (
                <CommandGroup heading="Community">
                  {communityRotations.map((rotation) => (
                    <CommandItem
                      key={rotation.id}
                      value={`community ${specLabelById.get(rotation.specId) ?? ""} ${rotation.name}`}
                      onSelect={() => handleSelect(rotation.id)}
                      className="flex items-center gap-2 py-3"
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{rotation.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {specLabelById.get(rotation.specId) ? (
                            <SpecLabel
                              specId={rotation.specId}
                              size="sm"
                              showIcon={false}
                            />
                          ) : (
                            "Unknown spec"
                          )}
                        </span>
                      </div>
                      {selectedId === rotation.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
