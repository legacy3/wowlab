"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Legend } from "./legend";
import { ClassRow } from "./class-row";
import { SpellListDialog } from "./spell-list-dialog";
import type { SelectedSpec } from "./types";

import { useSpecCoverage } from "@/hooks/use-spec-coverage";

export function CoverageMatrix() {
  const { data, loading, error } = useSpecCoverage();
  const [selectedSpec, setSelectedSpec] = useState<SelectedSpec | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const maxSpecs = useMemo(() => {
    if (!data) {
      return 0;
    }

    return Math.max(...data.classes.map((cls) => cls.specs.length));
  }, [data]);

  const handleSelectSpec = (spec: SelectedSpec) => {
    setSelectedSpec(spec);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading coverage matrix...
        </span>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Error: {error}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex justify-end">
          <Legend />
        </div>

        <div className="space-y-1">
          {data.classes.map((cls) => (
            <ClassRow
              key={cls.id}
              cls={cls}
              maxSpecs={maxSpecs}
              onSelectSpec={handleSelectSpec}
            />
          ))}
        </div>
      </div>

      <SpellListDialog
        spec={selectedSpec}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
