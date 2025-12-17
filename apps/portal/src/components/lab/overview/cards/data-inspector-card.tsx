"use client";

import Link from "next/link";
import { Table } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DataInspectorCard() {
  return (
    <Link href="/lab/inspector/search" className="block h-full">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5 text-primary" />
            Data Inspector
          </CardTitle>
          <CardDescription>Query and inspect game data by ID</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Browse and search spell, item, and talent data from the game files.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
