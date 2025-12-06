"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Sparkles } from "lucide-react";

export function TopGearOptimizationStatusCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Optimization Status</CardTitle>
        <CardDescription>
          Progress finding the best gear combination
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Simulations Complete</span>
            <span className="font-medium">847 / 2,496</span>
          </div>
          <Progress value={34} />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Best Found</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">DPS</span>
              <span className="text-2xl font-bold">2,984</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Improvement</span>
              <Badge>+137 DPS</Badge>
            </div>
          </div>
        </div>

        <Button className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Start Optimization
        </Button>
      </CardContent>
    </Card>
  );
}
