"use client";

import { memo } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TimelineSettingsProps {
  showFps: boolean;
  onShowFpsChange: (value: boolean) => void;
}

export const TimelineSettings = memo(function TimelineSettings({
  showFps,
  onShowFpsChange,
}: TimelineSettingsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="grid gap-4">
          <div className="font-medium text-sm">Settings</div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-fps" className="text-sm font-normal">
              Show FPS
            </Label>
            <Switch
              id="show-fps"
              checked={showFps}
              onCheckedChange={onShowFpsChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
