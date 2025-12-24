"use client";

import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Check, ChevronsUpDown, Sparkles } from "lucide-react";

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
  availableRotationsAtom,
  currentRotationAtom,
  isRotationAutoDetectedAtom,
  setRotationAtom,
} from "@/atoms/sim";
import { listRotations } from "@/lib/simulation/rotations";

export function RotationPicker() {
  const [open, setOpen] = useState(false);
  const currentRotation = useAtomValue(currentRotationAtom);
  const availableRotations = useAtomValue(availableRotationsAtom);
  const isAutoDetected = useAtomValue(isRotationAutoDetectedAtom);
  const [, setRotation] = useAtom(setRotationAtom);

  const allRotations = listRotations();
  const hasRotationsForClass = availableRotations.length > 0;

  // Group rotations by class
  const rotationsByClass = allRotations.reduce(
    (acc, rotation) => {
      if (!acc[rotation.class]) {
        acc[rotation.class] = [];
      }
      acc[rotation.class].push(rotation);
      return acc;
    },
    {} as Record<string, typeof allRotations>,
  );

  const handleSelect = (rotationId: string) => {
    // If selecting the same as auto-detected, reset to auto
    if (currentRotation?.id === rotationId && !isAutoDetected) {
      setRotation(null);
    } else {
      setRotation(rotationId);
    }
    setOpen(false);
  };

  const handleResetToAuto = () => {
    setRotation(null);
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
              {currentRotation ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currentRotation.name}</span>
                    {isAutoDetected && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <Sparkles className="h-2.5 w-2.5" />
                        Auto
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentRotation.class} · {currentRotation.spec}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-medium text-muted-foreground">
                    No rotation available
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hasRotationsForClass
                      ? "Select a rotation"
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
            <CommandInput placeholder="Search rotations..." />
            <CommandList>
              <CommandEmpty>No rotation found.</CommandEmpty>

              {!isAutoDetected && currentRotation && (
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

              {Object.entries(rotationsByClass).map(
                ([className, rotations]) => (
                  <CommandGroup key={className} heading={className}>
                    {rotations.map((rotation) => (
                      <CommandItem
                        key={rotation.id}
                        value={`${rotation.class} ${rotation.spec} ${rotation.name}`}
                        onSelect={() => handleSelect(rotation.id)}
                        className="flex flex-col items-start gap-1 py-3"
                      >
                        <div className="flex w-full items-center">
                          <span className="font-medium">{rotation.spec}</span>
                          {currentRotation?.id === rotation.id && (
                            <Check className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {rotation.name}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ),
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
