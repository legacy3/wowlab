"use client";

import { Input } from "@/components/ui/input";
import { SpecPicker } from "@/components/ui/spec-picker";

export function TalentStartScreen({
  talents,
  onTalentStringChange,
  onSpecSelect,
}: {
  talents: string;
  onTalentStringChange: (next: string | null) => void;
  onSpecSelect: (specId: number) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Import Talent String</h3>
          <p className="text-sm text-muted-foreground">
            Paste a talent loadout string to view and edit
          </p>
        </div>
        <div className="flex items-center gap-2 w-full">
          <Input
            placeholder="Paste a talent string..."
            value={talents}
            onChange={(e) =>
              onTalentStringChange(e.target.value.trim() || null)
            }
            className="flex-1 font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 w-full max-w-md">
        <div className="flex-1 border-t" />
        <span className="text-sm text-muted-foreground">or</span>
        <div className="flex-1 border-t" />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Start from Scratch</h3>
          <p className="text-sm text-muted-foreground">
            Choose a class and specialization
          </p>
        </div>
        <SpecPicker onSpecSelect={onSpecSelect} />
      </div>
    </div>
  );
}
