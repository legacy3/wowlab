"use client";

import { useMemo } from "react";
import { RotationCard } from "./rotation-card";
import type { Rotation } from "@/lib/supabase/types";
import { useClassesAndSpecs } from "@/hooks/use-classes-and-specs";

interface RotationsListProps {
  rotations: Rotation[];
  groupByClass?: boolean;
}

export function RotationsList({
  rotations,
  groupByClass = true,
}: RotationsListProps) {
  const { classes, specs } = useClassesAndSpecs();

  const classNameById = useMemo(() => {
    return new Map(
      (classes.result?.data ?? []).map((cls) => [cls.ID, cls.Name_lang ?? ""]),
    );
  }, [classes.result?.data]);

  const classIdBySpecId = useMemo(() => {
    return new Map(
      (specs.result?.data ?? []).map((spec) => [spec.ID, spec.ClassID]),
    );
  }, [specs.result?.data]);

  if (!groupByClass) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rotations.map((rotation) => (
          <RotationCard key={rotation.id} rotation={rotation} />
        ))}
      </div>
    );
  }

  const grouped = rotations.reduce(
    (acc, rotation) => {
      const classId = classIdBySpecId.get(rotation.specId);
      const className =
        (classId ? classNameById.get(classId) : undefined) || "Unknown";
      if (!acc[className]) {
        acc[className] = [];
      }
      acc[className].push(rotation);
      return acc;
    },
    {} as Record<string, Rotation[]>,
  );

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([className, classRotations]) => (
        <div key={className}>
          <h2 className="mb-3 text-xl font-semibold">{className}</h2>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {classRotations.map((rotation) => (
              <RotationCard key={rotation.id} rotation={rotation} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
