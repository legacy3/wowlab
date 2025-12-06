"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Play, Share2 } from "lucide-react";

export function WorkbenchQuickActionsCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full justify-start">
          <FileText className="mr-2 h-4 w-4" />
          Load Template
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Share2 className="mr-2 h-4 w-4" />
          Export Config
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Play className="mr-2 h-4 w-4" />
          Batch Run
        </Button>
      </CardContent>
    </Card>
  );
}
