"use client";

import { Suspense, useState } from "react";
import { useAtom } from "jotai";
import { Check, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  formatSchoolMask,
  formatPropertyName,
  propertyFormatters,
  type SpellDataKey,
} from "@/lib/spell-formatters";
import {
  selectedSpellIdAtom,
  selectedSpellAtom,
  spellListAtom,
} from "@/atoms/spell-data";

const SCHOOL_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Physical: "secondary",
  Holy: "default",
  Fire: "destructive",
  Nature: "outline",
  Frost: "default",
  Shadow: "secondary",
  Arcane: "outline",
};

const renderFormattedValue = (text: string): React.ReactNode => {
  return (
    <Badge variant="secondary" className="font-mono">
      {text}
    </Badge>
  );
};

const renderSchoolBadge = (
  value: unknown,
  formatted: string,
): React.ReactNode => {
  const school = formatSchoolMask(
    typeof value === "object" && value !== null && "schoolMask" in value
      ? (value.schoolMask as number)
      : (value as number),
  );

  const variant = school ? SCHOOL_VARIANTS[school] || "default" : "default";

  return <Badge variant={variant}>{formatted}</Badge>;
};

const renderValue = (key: string, value: unknown): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  const formatter = propertyFormatters[key as SpellDataKey];

  if (formatter) {
    const formatted = formatter(value);

    if (formatted !== null) {
      if (key.toLowerCase().includes("school")) {
        return renderSchoolBadge(value, formatted);
      }

      return renderFormattedValue(formatted);
    }
  }

  return <span>{String(value)}</span>;
};

const isDefaultValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (value === 0) {
    return true;
  }

  if (value === false) {
    return true;
  }

  if (value === "") {
    return true;
  }

  if (Array.isArray(value) && value.length === 0) {
    return true;
  }

  if (typeof value === "object" && Object.keys(value).length === 0) {
    return true;
  }

  return false;
};

function SpellDataViewInner() {
  const [selectedSpellId, setSelectedSpellId] = useAtom(selectedSpellIdAtom);
  const [spellData] = useAtom(selectedSpellAtom);
  const [spellList] = useAtom(spellListAtom);
  const [open, setOpen] = useState(false);
  const [hideDefaults, setHideDefaults] = useState(true);

  const selectedSpellName =
    spellList.find((s) => s.id === selectedSpellId)?.name ||
    spellData?.name ||
    null;

  const filteredEntries = spellData
    ? Object.entries(spellData).filter(([key, value]) => {
        if (hideDefaults && isDefaultValue(value)) {
          return false;
        }

        return true;
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label htmlFor="spell-selector">Spell</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="spell-selector"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[400px] justify-between"
            >
              {selectedSpellName || "Search for a spell..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput placeholder="Search spell..." />
              <CommandList>
                <CommandEmpty>No spell found.</CommandEmpty>
                <CommandGroup>
                  {spellList.map((spell) => (
                    <CommandItem
                      key={spell.id}
                      value={spell.name}
                      onSelect={() => {
                        setSelectedSpellId(spell.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSpellId === spell.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {spell.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {!spellData ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              Search for a spell to view its data
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="formatted" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="formatted">Formatted</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide-defaults"
                checked={hideDefaults}
                onCheckedChange={(checked) => setHideDefaults(checked === true)}
              />
              <Label
                htmlFor="hide-defaults"
                className="text-sm font-normal cursor-pointer"
              >
                Hide default values
              </Label>
            </div>
          </div>

          <TabsContent value="formatted" className="mt-4">
            <Card>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Property</TableHead>
                      <TableHead className="w-2/3">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.length > 0 ? (
                      filteredEntries.map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium align-top">
                            {formatPropertyName(key)}
                          </TableCell>
                          <TableCell className="align-top">
                            {renderValue(key, value)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No properties to display.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="raw" className="mt-4">
            <Card>
              <CardContent className="p-4 relative">
                <CopyButton
                  value={JSON.stringify(spellData, null, 2)}
                  className="absolute top-6 right-6 z-10"
                />
                <ScrollArea className="h-[600px]">
                  <pre className="text-sm pr-12">
                    {JSON.stringify(spellData, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function SpellDataViewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-10 w-[400px]" />
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function SpellDataView() {
  return (
    <Suspense fallback={<SpellDataViewSkeleton />}>
      <SpellDataViewInner />
    </Suspense>
  );
}
