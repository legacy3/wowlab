"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { GameIcon } from "@/components/game";
import { CLASS_COLORS } from "@/lib/colors";
import { useClassesAndSpecs } from "@/hooks/use-classes-and-specs";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface SpecPickerBaseProps {
  onSpecSelect: (specId: number, className: string, specName: string) => void;
}

interface SpecPickerProps extends SpecPickerBaseProps {
  /** Currently selected spec ID (only used for compact mode) */
  specId?: number | null;
  /** Compact mode shows as a button that opens a popover */
  compact?: boolean;
  className?: string;
}

// =============================================================================
// Shared Grid Components
// =============================================================================

interface ClassGridProps {
  classes: Array<{
    ID: number;
    Name_lang: string | null;
    Filename: string | null;
  }>;
  onSelectClass: (classId: number) => void;
  compact?: boolean;
}

function ClassGrid({ classes, onSelectClass, compact }: ClassGridProps) {
  return (
    <div className={cn("grid grid-cols-5 gap-1.5", !compact && "gap-2")}>
      {classes.map((cls) => (
        <button
          key={cls.ID}
          onClick={() => onSelectClass(cls.ID)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-md hover:bg-accent transition-colors",
            compact ? "p-1.5" : "p-1.5 gap-1",
          )}
        >
          <GameIcon
            iconName={`class_${cls.Filename?.toLowerCase()}`}
            size="large"
            alt={cls.Name_lang ?? ""}
            className={compact ? "w-9 h-9" : "w-10 h-10"}
          />
          <span
            className={cn(
              "leading-tight text-center",
              compact ? "text-[8px]" : "text-[9px]",
            )}
          >
            {cls.Name_lang}
          </span>
        </button>
      ))}
    </div>
  );
}

interface SpecGridProps {
  specs: Array<{
    ID: number;
    Name_lang: string | null;
    iconName: string;
  }>;
  selectedSpecId?: number | null;
  onSelectSpec: (specId: number) => void;
  onBack: () => void;
  compact?: boolean;
}

function SpecGrid({
  specs,
  selectedSpecId,
  onSelectSpec,
  onBack,
  compact,
}: SpecGridProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={onBack}
        className={cn(
          "flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors",
          compact ? "text-xs" : "text-sm gap-2",
        )}
      >
        <ChevronLeft className={compact ? "size-3" : "w-4 h-4"} />
        {compact ? "Back" : "Back to classes"}
      </button>
      <div
        className={cn("flex gap-1.5 justify-center", !compact && "gap-2 pt-2")}
      >
        {specs.map((spec) => (
          <button
            key={spec.ID}
            onClick={() => onSelectSpec(spec.ID)}
            className={cn(
              "flex flex-col items-center gap-1 rounded hover:bg-accent transition-colors",
              compact ? "p-2 w-20" : "p-1.5 w-20",
              spec.ID === selectedSpecId && "bg-accent",
            )}
          >
            <GameIcon
              iconName={spec.iconName}
              size="large"
              alt={spec.Name_lang ?? ""}
              className="w-10 h-10"
            />
            <span
              className={cn(
                "text-center leading-tight",
                compact ? "text-[10px]" : "text-[10px] h-8 flex items-center",
              )}
            >
              {spec.Name_lang}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function GridSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "grid grid-cols-5 gap-1.5",
        !compact && "gap-2 min-h-[140px] place-items-center",
      )}
    >
      {Array.from({ length: 13 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col items-center gap-1",
            compact ? "p-1" : "p-1.5",
          )}
        >
          <Skeleton
            className={compact ? "w-9 h-9 rounded" : "w-10 h-10 rounded-md"}
          />
          {!compact && <Skeleton className="w-12 h-3 rounded" />}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Compact Mode (Popover)
// =============================================================================

interface CompactSpecPickerInnerProps extends SpecPickerBaseProps {
  specId?: number | null;
  className?: string;
}

function CompactSpecPickerInner({
  specId,
  onSpecSelect,
  className,
}: CompactSpecPickerInnerProps) {
  const [open, setOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const { classes, specs } = useClassesAndSpecs();

  const classesData = classes.result?.data ?? [];
  const specsData = specs.result?.data ?? [];

  const currentSpec = specsData.find((s) => s.ID === specId);
  const currentClass = currentSpec
    ? classesData.find((c) => c.ID === currentSpec.ClassID)
    : null;

  const selectedClass = classesData.find((c) => c.ID === selectedClassId);
  const specsForClass = specsData.filter((s) => s.ClassID === selectedClassId);

  const handleSelectSpec = (newSpecId: number) => {
    const spec = specsData.find((s) => s.ID === newSpecId);
    const cls = spec ? classesData.find((c) => c.ID === spec.ClassID) : null;
    onSpecSelect(newSpecId, cls?.Name_lang ?? "", spec?.Name_lang ?? "");
    setOpen(false);
    setSelectedClassId(null);
  };

  const isLoading = classes.query.isLoading || specs.query.isLoading;

  // Trigger content
  const triggerContent = () => {
    if (isLoading) {
      return <Skeleton className="h-4 w-24" />;
    }

    if (!currentSpec || !currentClass) {
      return <span className="text-muted-foreground">Select spec...</span>;
    }

    const classColor = CLASS_COLORS[currentClass.Name_lang ?? ""] ?? "#FFFFFF";

    return (
      <span className="flex items-center gap-1.5">
        <GameIcon
          iconName={currentSpec.iconName}
          size="small"
          className="w-4 h-4"
        />
        <span style={{ color: classColor }} className="font-medium">
          {currentClass.Name_lang}
        </span>
        <span className="text-muted-foreground">/</span>
        <span>{currentSpec.Name_lang}</span>
      </span>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 px-2 text-xs gap-1", className)}
        >
          {triggerContent()}
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-2" align="start">
        {isLoading ? (
          <GridSkeleton compact />
        ) : selectedClass ? (
          <SpecGrid
            specs={specsForClass}
            selectedSpecId={specId}
            onSelectSpec={handleSelectSpec}
            onBack={() => setSelectedClassId(null)}
            compact
          />
        ) : (
          <ClassGrid
            classes={classesData}
            onSelectClass={setSelectedClassId}
            compact
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// Full Mode (Card)
// =============================================================================

function FullSpecPickerInner({ onSpecSelect }: SpecPickerBaseProps) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const { classes, specs } = useClassesAndSpecs();

  const classesData = classes.result?.data ?? [];
  const specsData = specs.result?.data ?? [];

  const selectedClass = classesData.find((c) => c.ID === selectedClassId);
  const specsForClass = specsData.filter((s) => s.ClassID === selectedClassId);

  const handleSelectSpec = (specId: number) => {
    const spec = specsData.find((s) => s.ID === specId);
    onSpecSelect(specId, selectedClass?.Name_lang ?? "", spec?.Name_lang ?? "");
  };

  if (classes.query.isLoading || specs.query.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Card className="p-4 w-[420px]">
          <GridSkeleton />
        </Card>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Card className="relative p-4 w-[420px]">
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setSelectedClassId(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to classes
            </button>
          </div>
          <div className="flex gap-2 justify-center items-center pt-8">
            {specsForClass.map((spec) => (
              <button
                key={spec.ID}
                onClick={() => handleSelectSpec(spec.ID)}
                className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-md hover:bg-accent transition-colors w-20"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <GameIcon
                    iconName={spec.iconName}
                    size="large"
                    alt={spec.Name_lang ?? ""}
                    className="w-10 h-10"
                  />
                </div>
                <span className="text-[10px] leading-tight text-center h-8 flex items-center">
                  {spec.Name_lang}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Card className="p-4 w-[420px]">
        <ClassGrid classes={classesData} onSelectClass={setSelectedClassId} />
      </Card>
    </div>
  );
}

// =============================================================================
// Main Export
// =============================================================================

export function SpecPicker({
  specId,
  onSpecSelect,
  compact = false,
  className,
}: SpecPickerProps) {
  if (compact) {
    return (
      <CompactSpecPickerInner
        specId={specId}
        onSpecSelect={onSpecSelect}
        className={className}
      />
    );
  }

  return <FullSpecPickerInner onSpecSelect={onSpecSelect} />;
}

// Skeleton for loading state
export function SpecPickerSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return <Skeleton className="h-7 w-32" />;
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Card className="p-4 w-[420px]">
        <GridSkeleton />
      </Card>
    </div>
  );
}
