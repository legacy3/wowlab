"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface ResultCardProps {
  result: string | null;
}

export function ResultCard({ result }: ResultCardProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-5 w-5" />
            Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Run a simulation to see results here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-500/20 bg-green-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          Success
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-green-600 dark:text-green-400">{result}</p>
      </CardContent>
    </Card>
  );
}
