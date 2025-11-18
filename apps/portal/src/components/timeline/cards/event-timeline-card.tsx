"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const EVENTS = [
  { time: "0:00", event: "Mind Blast", type: "cast", damage: 2847 },
  { time: "0:01", event: "Shadow Word: Pain", type: "cast", damage: 568 },
  { time: "0:02", event: "Vampiric Touch", type: "cast", damage: 398 },
  { time: "0:03", event: "Mind Flay (tick 1)", type: "tick", damage: 171 },
  { time: "0:04", event: "Mind Flay (tick 2)", type: "tick", damage: 171 },
  { time: "0:05", event: "Mind Flay (tick 3)", type: "tick", damage: 170 },
  { time: "0:06", event: "Mind Blast", type: "cast", damage: 2847 },
  { time: "0:07", event: "Shadow Word: Death", type: "cast", damage: 1420 },
  { time: "0:08", event: "Mind Flay (tick 1)", type: "tick", damage: 171 },
  { time: "0:09", event: "Shadowfiend", type: "cooldown", damage: 0 },
] as const;

export function TimelineEventTimelineCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Event Timeline</CardTitle>
            <CardDescription>
              Chronological view of combat actions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {EVENTS.map((event) => (
            <div
              key={`${event.time}-${event.event}`}
              className="flex items-center gap-4 rounded border-l-4 p-3 transition-colors hover:bg-muted/50"
              style={{
                borderLeftColor:
                  event.type === "cast"
                    ? "hsl(var(--primary))"
                    : event.type === "tick"
                      ? "hsl(var(--muted-foreground))"
                      : "hsl(var(--destructive))",
              }}
            >
              <div className="flex w-16 items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {event.time}
              </div>
              <div className="flex-1">
                <p className="font-medium">{event.event}</p>
              </div>
              <Badge
                variant={
                  event.type === "cooldown" ? "destructive" : "secondary"
                }
              >
                {event.type}
              </Badge>
              {event.damage > 0 && (
                <div className="w-24 text-right font-mono text-sm">
                  {event.damage.toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
