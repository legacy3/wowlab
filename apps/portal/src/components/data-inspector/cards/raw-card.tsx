"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Database } from "lucide-react";
import { JsonView } from "../json-view";
import {
  queryLoadingAtom,
  queryErrorAtom,
  rawDataAtom,
} from "@/atoms/data-inspector";

export function RawCard() {
  const [open, setOpen] = useState(false);
  const loading = useAtomValue(queryLoadingAtom);
  const error = useAtomValue(queryErrorAtom);
  const data = useAtomValue(rawDataAtom);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center gap-2 w-fit">
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Raw DBC Tables
            </CardTitle>
          </CollapsibleTrigger>
          <CardDescription className="ml-6">
            Direct query results from individual DBC tables
          </CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-2">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : data && !error ? (
              Object.entries(data).map(([key, value]) => (
                <RawDataSection
                  key={key}
                  title={key}
                  data={value}
                  maxHeight={
                    Array.isArray(value) && value.length > 1
                      ? "max-h-96"
                      : undefined
                  }
                />
              ))
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Database className="h-8 w-8 opacity-30" />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function RawDataSection({
  title,
  data,
  maxHeight,
}: {
  title: string;
  data: unknown;
  maxHeight?: string;
}) {
  const count = Array.isArray(data) ? ` (${data.length})` : "";

  return (
    <div>
      <h3 className="text-sm font-medium mb-2 text-muted-foreground">
        {title}
        {count}
      </h3>
      <JsonView data={data} maxHeight={maxHeight} />
    </div>
  );
}
