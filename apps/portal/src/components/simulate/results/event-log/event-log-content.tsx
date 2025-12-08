"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAtomValue } from "jotai";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { WowSpellLink } from "@/components/game";
import { jobsAtom } from "@/atoms/computing";
import type { SimulationEvent } from "@/lib/simulation/types";
import { isResourceSnapshot } from "@/lib/simulation/transform-events";

type EventCategory = "cast" | "damage" | "aura" | "resource" | "other";

interface DisplayEvent {
  id: string;
  timestamp: number;
  category: EventCategory;
  type: string;
  spellId: number | null;
  source: string;
  target: string;
  details: string;
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  cast: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  damage: "bg-red-500/20 text-red-400 border-red-500/30",
  aura: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  resource: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function getEventCategory(tag: string): EventCategory {
  if (tag.startsWith("SPELL_CAST") || tag === "SPELL_CAST_START") {
    return "cast";
  }

  if (tag.includes("DAMAGE")) {
    return "damage";
  }

  if (tag.includes("AURA")) {
    return "aura";
  }

  if (
    tag.includes("ENERGIZE") ||
    tag.includes("DRAIN") ||
    tag === "RESOURCE_SNAPSHOT"
  ) {
    return "resource";
  }

  return "other";
}

function formatTimestamp(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);

  return `${minutes}:${seconds.padStart(5, "0")}`;
}

function transformEvent(event: SimulationEvent, index: number): DisplayEvent {
  if (isResourceSnapshot(event)) {
    return {
      id: `evt-${index}`,
      timestamp: event.timestamp,
      category: "resource",
      type: "RESOURCE_SNAPSHOT",
      spellId: null,
      source: "Player",
      target: "-",
      details: `Focus: ${event.focus}/${event.maxFocus}`,
    };
  }

  const tag = event._tag;
  const category = getEventCategory(tag);

  // Extract spell info if available
  const spellId = "spellId" in event ? event.spellId : null;

  // Extract source/target
  const source = "sourceName" in event ? (event.sourceName as string) : "-";
  const target = "destName" in event ? (event.destName as string) : "-";

  // Build details based on event type
  let details = "";
  if ("amount" in event && typeof event.amount === "number") {
    if (tag.includes("DAMAGE")) {
      const crit = "critical" in event && event.critical ? " (Crit)" : "";
      details = `${event.amount.toLocaleString()} damage${crit}`;
    } else if (tag.includes("ENERGIZE")) {
      details = `+${event.amount} resource`;
    } else if (tag.includes("DRAIN")) {
      details = `-${event.amount} resource`;
    } else {
      details = `${event.amount}`;
    }
  }

  if ("auraType" in event) {
    details = event.auraType as string;
  }

  if (tag === "SPELL_CAST_FAILED" && "failedType" in event) {
    details = `Failed: ${event.failedType}`;
  }

  return {
    id: `evt-${index}`,
    timestamp: event.timestamp,
    category,
    type: tag,
    spellId,
    source,
    target,
    details,
  };
}

export function EventLogContent() {
  const params = useParams();
  const jobId = params?.id as string | undefined;
  const jobs = useAtomValue(jobsAtom);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">(
    "all",
  );

  const job = jobs.find((j) => j.id === jobId);
  const rawEvents = (job?.result?.events ?? []) as SimulationEvent[];

  const displayEvents = useMemo(() => {
    return rawEvents.map(transformEvent);
  }, [rawEvents]);

  const filteredEvents = useMemo(() => {
    return displayEvents.filter((event) => {
      // Category filter
      if (categoryFilter !== "all" && event.category !== categoryFilter) {
        return false;
      }

      // Text filter
      if (filter) {
        const searchLower = filter.toLowerCase();

        return (
          event.type.toLowerCase().includes(searchLower) ||
          event.source.toLowerCase().includes(searchLower) ||
          event.target.toLowerCase().includes(searchLower) ||
          event.details.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [displayEvents, filter, categoryFilter]);

  const exportJson = useMemo(() => {
    return JSON.stringify(filteredEvents, null, 2);
  }, [filteredEvents]);

  const categories: (EventCategory | "all")[] = [
    "all",
    "cast",
    "damage",
    "aura",
    "resource",
  ];

  if (!job?.result?.events) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No event data available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                Event Log ({filteredEvents.length.toLocaleString()} events)
              </CardTitle>
              <CopyButton value={exportJson} />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    categoryFilter === cat
                      ? cat === "all"
                        ? "bg-primary/20 text-primary border-primary/30"
                        : CATEGORY_COLORS[cat]
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === "all"
                    ? "All"
                    : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filter events..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <div className="max-h-[600px] overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[80px]">Time</TableHead>
                  <TableHead className="w-[100px]">Category</TableHead>
                  <TableHead className="w-[180px]">Event</TableHead>
                  <TableHead>Spell</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No events match the current filter
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-xs">
                        {formatTimestamp(event.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={CATEGORY_COLORS[event.category]}
                        >
                          {event.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {event.type}
                      </TableCell>
                      <TableCell>
                        {event.spellId !== null ? (
                          <span className="text-sm">
                            <WowSpellLink spellId={event.spellId} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{event.source}</TableCell>
                      <TableCell className="text-sm">{event.target}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.details || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
