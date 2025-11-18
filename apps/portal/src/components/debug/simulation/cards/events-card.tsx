"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import type * as Events from "@packages/innocent-domain/Events";

interface EventsCardProps {
  events: Events.SimulationEvent[];
}

export function EventsCard({ events }: EventsCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          Simulation Events {events.length > 0 && `(${events.length})`}
        </CardTitle>
        <CardDescription>
          Timeline of events that occurred during simulation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No events yet</p>
            <p className="text-xs mt-1">
              Run a simulation to see the event timeline
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto bg-muted/30 rounded border">
            <div className="p-3">
              <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify(events, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
