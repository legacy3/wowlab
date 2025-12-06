"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Save } from "lucide-react";

export function WorkbenchConfigurationCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Configuration</CardTitle>
            <CardDescription>Experimental simulation setup</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button size="sm">
              <Play className="mr-2 h-4 w-4" />
              Run
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <pre className="text-muted-foreground">
            {`{
  "character": {
    "class": "Priest",
    "spec": "Shadow",
    "level": 70
  },
  "fight": {
    "duration": 300,
    "type": "patchwerk",
    "target_count": 1
  },
  "settings": {
    "iterations": 1000,
    "threads": 4,
    "seed": 42
  }
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
