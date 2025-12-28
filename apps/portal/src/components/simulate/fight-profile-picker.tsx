"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { Check, ChevronsUpDown } from "lucide-react";

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
import { targetTypeAtom, type TargetType } from "@/atoms/sim";

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

export function FightProfilePicker() {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useAtom(targetTypeAtom);

  const selectedProfile =
    FIGHT_PROFILES.find((p) => p.id === targetType) ?? FIGHT_PROFILES[0];

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

  return (
    <div className="space-y-2" data-tour="fight-profile">
      <Label className="text-sm font-medium">Fight Profile</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
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
            <CommandInput placeholder="Search profiles ..." />
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
                        setOpen(false);
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
  );
}
