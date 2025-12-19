"use client";

import Link from "next/link";
import { CheckSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SpecCoverageCard() {
  return (
    <Link href="/lab/spec-coverage" className="block h-full">
      <Card
        className="h-full transition-colors hover:border-primary/50"
        data-tour="spec-coverage"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Spec Coverage
          </CardTitle>
          <CardDescription>
            Track simulator implementation progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            See which specs and abilities are implemented in the simulator.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
