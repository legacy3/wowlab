"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Shield } from "lucide-react";
import { useSpellData } from "../spell-context";

export function AuraRestrictionsCard() {
  const spell = useSpellData();
  const { auraRestrictions } = spell;
  const hasRestrictions =
    auraRestrictions.casterMustHave.length > 0 ||
    auraRestrictions.casterMustNotHave.length > 0 ||
    auraRestrictions.targetMustHave.length > 0 ||
    auraRestrictions.targetMustNotHave.length > 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Aura Restrictions</CardTitle>
      </CardHeader>
      <CardContent>
        {hasRestrictions ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Caster Must Have:</p>
              <p className="text-muted-foreground">
                {auraRestrictions.casterMustHave.length > 0
                  ? auraRestrictions.casterMustHave.join(", ")
                  : "(none)"}
              </p>
            </div>
            <div>
              <p className="font-medium">Caster Must NOT Have:</p>
              <p className="text-muted-foreground">
                {auraRestrictions.casterMustNotHave.length > 0
                  ? auraRestrictions.casterMustNotHave.join(", ")
                  : "(none)"}
              </p>
            </div>
            <div>
              <p className="font-medium">Target Must Have:</p>
              <p className="text-muted-foreground">
                {auraRestrictions.targetMustHave.length > 0
                  ? auraRestrictions.targetMustHave.join(", ")
                  : "(none)"}
              </p>
            </div>
            <div>
              <p className="font-medium">Target Must NOT Have:</p>
              <p className="text-muted-foreground">
                {auraRestrictions.targetMustNotHave.length > 0
                  ? auraRestrictions.targetMustNotHave.join(", ")
                  : "(none)"}
              </p>
            </div>
          </div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyMedia variant="icon">
              <Shield className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">
                No Aura Restrictions
              </EmptyTitle>
              <EmptyDescription>
                This spell has no aura requirements.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
