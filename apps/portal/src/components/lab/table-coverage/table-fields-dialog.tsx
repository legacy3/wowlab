"use client";

import { useMemo, useState, useEffect } from "react";
import { Check, X, Search, ChevronDown } from "lucide-react";
import {
  getDbcTableFields,
  type DbcFieldInfo,
} from "@wowlab/core/DbcTableRegistry";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { Link } from "@/components/ui/link";

export interface SelectedTable {
  name: string;
  snakeName: string;
  supported: boolean;
}

interface TableFieldsDialogProps {
  table: SelectedTable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// TODO Not a fan of this tbh
function TypeBadge({ type }: { type: string }) {
  const colorClass = useMemo(() => {
    if (type === "number") {
      return "bg-blue-500/10 text-blue-500";
    }

    if (type === "string") {
      return "bg-green-500/10 text-green-500";
    }

    if (type === "boolean") {
      return "bg-purple-500/10 text-purple-500";
    }

    if (type.includes("null")) {
      return "bg-amber-500/10 text-amber-500";
    }

    return "bg-muted text-muted-foreground";
  }, [type]);

  return (
    <span
      className={cn("rounded px-1.5 py-0.5 text-[10px] font-mono", colorClass)}
    >
      {type}
    </span>
  );
}

export function TableFieldsDialog({
  table,
  open,
  onOpenChange,
}: TableFieldsDialogProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open, table]);

  const fields = useMemo(() => {
    if (!table?.supported) {
      return null;
    }

    return getDbcTableFields(table.snakeName);
  }, [table]);

  const { results: filteredFields } = useFuzzySearch({
    items: fields ?? [],
    query: search,
    keys: ["name", "type"],
    threshold: 0.3,
  });

  const groups = useMemo(() => {
    if (!filteredFields.length) {
      return [];
    }

    const idFields: DbcFieldInfo[] = [];
    const dataFields: DbcFieldInfo[] = [];
    const langFields: DbcFieldInfo[] = [];

    for (const field of filteredFields) {
      if (field.name === "ID" || field.name.endsWith("ID")) {
        idFields.push(field);
      } else if (field.name.endsWith("_lang")) {
        langFields.push(field);
      } else {
        dataFields.push(field);
      }
    }

    return [
      { key: "ids", label: "ID Fields", fields: idFields },
      { key: "data", label: "Data Fields", fields: dataFields },
      { key: "lang", label: "Localized Fields", fields: langFields },
    ].filter((g) => g.fields.length > 0);
  }, [filteredFields]);

  return (
    <Dialog open={open && !!table} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] grid-rows-[auto_1fr] overflow-hidden">
        {table && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {table.supported ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
                <code className="font-mono">{table.name}</code>
              </DialogTitle>

              <DialogDescription className="flex items-center gap-2">
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                  {table.snakeName}
                </code>
                {table.supported ? (
                  <Badge variant="outline" className="text-green-600">
                    Supported
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not implemented
                  </Badge>
                )}
                <Link
                  href={`https://wago.tools/db2/${table.name}`}
                  external
                  className="ml-auto text-sm"
                >
                  View on Wago
                </Link>
              </DialogDescription>
            </DialogHeader>

            {table.supported && fields ? (
              <ScrollArea className="h-full min-h-0">
                <div className="space-y-4 pr-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter fields..."
                      className="pl-9"
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {filteredFields.length} of {fields.length} fields
                  </div>

                  {groups.map((group) => (
                    <Collapsible
                      key={group.key}
                      defaultOpen
                      className="rounded-md border"
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/30"
                        >
                          <div className="text-sm font-medium">
                            {group.label}
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              ({group.fields.length})
                            </span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="px-3 pb-3">
                        <div className="space-y-1 pt-1">
                          {group.fields.map((field) => (
                            <div
                              key={field.name}
                              className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/30"
                            >
                              <code className="font-mono text-xs">
                                {field.name}
                                {field.optional && (
                                  <span className="text-muted-foreground">
                                    ?
                                  </span>
                                )}
                              </code>
                              <TypeBadge type={field.type} />
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}

                  {filteredFields.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No fields match your search
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <Empty className="h-full border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <X className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>Not implemented</EmptyTitle>
                  <EmptyDescription>
                    This table has no schema information available yet.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
