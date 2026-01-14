"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Sparkles } from "lucide-react";
import { useSpellData } from "../spell-context";

export function EmpowerCard() {
  const spell = useSpellData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Empower Data</CardTitle>
      </CardHeader>
      <CardContent>
        {spell.empowerData ? (
          <div>Empower data here</div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyMedia variant="icon">
              <Sparkles className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">Not Empowered</EmptyTitle>
              <EmptyDescription>
                This is not an empowered spell (Evoker mechanic).
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
