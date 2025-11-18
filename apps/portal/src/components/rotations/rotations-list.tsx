import { RotationCard } from "./rotation-card";
import type { Rotation } from "@/lib/supabase/types";

interface RotationsListProps {
  rotations: Rotation[];
  groupByClass?: boolean;
}

export function RotationsList({
  rotations,
  groupByClass = true,
}: RotationsListProps) {
  if (!groupByClass) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rotations.map((rotation) => (
          <RotationCard key={rotation.id} rotation={rotation} />
        ))}
      </div>
    );
  }

  // Group by class
  const grouped = rotations.reduce(
    (acc, rotation) => {
      if (!acc[rotation.class]) {
        acc[rotation.class] = [];
      }
      acc[rotation.class].push(rotation);
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
