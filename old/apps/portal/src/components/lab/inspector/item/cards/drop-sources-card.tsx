"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin } from "lucide-react";
import { useItemData } from "../item-context";

export function DropSourcesCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 shrink-0" />
          Drop Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {item.dropSources.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Instance</TableHead>
                  <TableHead className="font-medium">Encounter</TableHead>
                  <TableHead className="font-medium">Base iLvl</TableHead>
                  <TableHead className="font-medium">Drop Chance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.dropSources.map((source, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {source.source}
                    </TableCell>
                    <TableCell>{source.difficulty}</TableCell>
                    <TableCell>{source.baseItemLevel}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {source.dropChance}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyMedia variant="icon">
              <MapPin className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">No Drop Sources</EmptyTitle>
              <EmptyDescription>
                No dungeon or raid drop sources found for this item.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
