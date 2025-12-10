"use client";

import { useState } from "react";
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
import { Wand2, AlertCircle, ChevronDown } from "lucide-react";
import { JsonView } from "../json-view";
import { useDataInspector } from "@/hooks/use-data-inspector";

export function TransformedCard() {
  const [open, setOpen] = useState(true);
  const { type: dataType, loading, error, data } = useDataInspector();

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center gap-2 w-fit">
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Transformed Data
            </CardTitle>
          </CollapsibleTrigger>
          <CardDescription className="ml-6">
            Processed {dataType} entity with all data
          </CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="break-all">{error}</span>
              </div>
            ) : data ? (
              <JsonView data={data} maxHeight="max-h-[600px]" />
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Wand2 className="h-8 w-8 opacity-30" />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
