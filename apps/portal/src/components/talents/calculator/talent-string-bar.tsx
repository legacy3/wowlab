"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { TalentPresetPicker } from "./talent-preset-picker";

export function TalentStringBar({
  talents,
  specId,
  onTalentStringChange,
}: {
  talents: string;
  specId: number | null; // TODO Not sure if this needs nullable
  onTalentStringChange: (next: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Paste a talent string..."
        value={talents}
        onChange={(e) => onTalentStringChange(e.target.value.trim() || null)}
        className="flex-1 font-mono text-sm"
      />
      {talents && <CopyButton value={talents} label="Talent String" />}
      <TalentPresetPicker
        currentSpecId={specId}
        onPresetSelect={onTalentStringChange}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => onTalentStringChange(null)}
        title="Clear"
        disabled={!talents}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
