"use client";

import Link from "next/link";
import { Calculator } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TalentCalculatorCard() {
  return (
    <Link href="/lab/talent-calculator" className="block h-full">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Talent Calculator
          </CardTitle>
          <CardDescription>Interactive talent tree builder</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Build and share talent configurations with import/export support.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
