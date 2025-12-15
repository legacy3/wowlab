"use client";

import { useState } from "react";
import { GameIcon } from "@/components/game";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassesAndSpecs } from "@/hooks/use-classes-and-specs";

interface SpecPickerProps {
  onSpecSelect: (specId: number, className: string, specName: string) => void;
}

export function SpecPicker({ onSpecSelect }: SpecPickerProps) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const { classes, specs } = useClassesAndSpecs();

  const classesData = classes.result?.data ?? [];
  const specsData = specs.result?.data ?? [];

  const selectedClass = classesData.find((c) => c.ID === selectedClassId);
  const specsForClass = specsData.filter((s) => s.ClassID === selectedClassId);

  if (classes.query.isLoading || specs.query.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Card className="p-4 w-[420px]">
          <div className="grid grid-cols-5 gap-2 min-h-[140px] place-items-center">
            {Array.from({ length: 13 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-1.5">
                <Skeleton className="w-10 h-10 rounded-md" />
                <Skeleton className="w-12 h-3 rounded" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Card className="relative p-4 w-[420px]">
          <button
            onClick={() => setSelectedClassId(null)}
            className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to classes
          </button>
          <div className="flex gap-2 justify-center items-center pt-8">
            {specsForClass.map((spec) => (
              <button
                key={spec.ID}
                onClick={() =>
                  onSpecSelect(
                    spec.ID,
                    selectedClass.Name_lang ?? "",
                    spec.Name_lang ?? "",
                  )
                }
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
        <div className="grid grid-cols-5 gap-2 min-h-[140px] place-items-center">
          {classesData.map((cls) => (
            <button
              key={cls.ID}
              onClick={() => setSelectedClassId(cls.ID)}
              className="flex flex-col items-center gap-1 p-1.5 rounded-md hover:bg-accent transition-colors"
            >
              <GameIcon
                iconName={`class_${cls.Filename?.toLowerCase()}`}
                size="large"
                alt={cls.Name_lang ?? ""}
                className="w-10 h-10"
              />
              <span className="text-[9px] leading-tight text-center">
                {cls.Name_lang}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
