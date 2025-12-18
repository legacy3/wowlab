"use client";

import Link from "next/link";
import { Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TableCoverageCard() {
  return (
    <Link href="/lab/table-coverage" className="block h-full">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Table Coverage
          </CardTitle>
          <CardDescription>DBC table implementation status</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Browse all available DBC tables and see which ones are supported.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
