"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PresetCharactersCard() {
  return (
    <Link href="/lab/preset-characters" className="block h-full">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 shrink-0 text-primary" />
            Preset Characters
          </CardTitle>
          <CardDescription>
            View default character profiles for simulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Explore the preset characters used when no custom profile is
            provided.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
