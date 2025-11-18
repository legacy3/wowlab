"use client";

import { Suspense } from "react";
import { useAtom } from "jotai";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { simcStringAtom, importStatusAtom } from "@/atoms/sim";

function ImportContentInner() {
  const [simcString, setSimcString] = useAtom(simcStringAtom);
  const [importStatus, setImportStatus] = useAtom(importStatusAtom);

  const handleImport = () => {
    if (!simcString.trim()) {
      return;
    }

    setImportStatus("importing");

    // Simulate import process
    setTimeout(() => {
      setImportStatus("success");
      console.log("Importing SimC string:", simcString);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Options</CardTitle>
        <CardDescription>
          Paste a SimulationCraft export exactly as provided by the addon.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mx-auto w-full max-w-3xl space-y-3">
          <div className="space-y-2">
            <Label htmlFor="simc-string">SimulationCraft String</Label>
            <Textarea
              id="simc-string"
              value={simcString}
              onChange={(e) => setSimcString(e.target.value)}
              placeholder={`# Wellenwilli - Restoration - 2025-10-26 02:37 - EU/Blackmoore
# SimC Addon 12.0.0-02
# WoW 11.2.5.63906, TOC 110205
# Requires SimulationCraft 1000-01 or newer

shaman="Wellenwilli"
level=80
race=tauren
region=eu
server=blackmoore
role=attack
professions=alchemy=9/jewelcrafting=1
spec=restoration

talents=CgQAL+iDLHPJSLC+6fqMJ8tubCAAAAAAAAAAYMzMmZZMY2WmtZWmhFbmZBGwEMLMhMWMzDY2YmtZmZmMbLMz0YGmZDLzYGMGmlxAAAD

head=,id=212011,bonus_id=6652/10877/10260/10356/8095/10371/1524
# ...`}
              rows={16}
              className="h-72 resize-vertical font-mono text-sm leading-6"
            />
            <p className="text-xs text-muted-foreground">
              Include the full export starting with metadata comments and gear
              listings. We trim and validate the content automatically.
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={handleImport}
            disabled={!simcString.trim() || importStatus === "importing"}
          >
            <FileText className="mr-2 h-4 w-4" />
            {importStatus === "importing"
              ? "Importing..."
              : "Import SimulationCraft String"}
          </Button>
          {importStatus === "success" && (
            <p className="text-sm text-green-600">
              Import successful! (This is a placeholder - actual import logic to
              be implemented)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ImportContentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent>
        <div className="mx-auto w-full max-w-3xl space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ImportContent() {
  return (
    <Suspense fallback={<ImportContentSkeleton />}>
      <ImportContentInner />
    </Suspense>
  );
}
