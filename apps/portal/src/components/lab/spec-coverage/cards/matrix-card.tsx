"use client";

import { Grid3X3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoverageMatrix } from "../coverage-matrix";

export function MatrixCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Grid3X3 className="h-5 w-5" />
          Coverage Matrix
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Spell handler coverage per spec. Hover over cells for details.
        </p>
      </CardHeader>
      <CardContent>
        <CoverageMatrix />
      </CardContent>
    </Card>
  );
}
