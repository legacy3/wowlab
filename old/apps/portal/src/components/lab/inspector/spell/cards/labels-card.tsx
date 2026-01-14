"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useSpellData } from "../spell-context";

export function LabelsCard() {
  const spell = useSpellData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Spell Labels</CardTitle>
        <CardDescription>
          Labels are used by talents/effects to target groups of spells.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {spell.labels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {spell.labels.map((label) => (
              <Badge key={label.id} variant="secondary">
                {label.id}: {label.name}
              </Badge>
            ))}
          </div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyHeader>
              <EmptyTitle className="text-base">No Labels</EmptyTitle>
              <EmptyDescription>
                No labels assigned to this spell.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
