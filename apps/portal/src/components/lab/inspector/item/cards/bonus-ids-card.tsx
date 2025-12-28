"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useItemData } from "../item-context";

export function BonusIdsCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Bonus IDs</CardTitle>
        <CardDescription className="text-xs font-mono">
          [{item.bonusIds.join(", ")}]
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-medium">ID</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Value</TableHead>
                <TableHead className="font-medium">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.bonusBreakdown.map((bonus) => (
                <TableRow key={bonus.id}>
                  <TableCell className="font-mono tabular-nums">
                    {bonus.id}
                  </TableCell>
                  <TableCell>
                    {bonus.type}{" "}
                    <span className="tabular-nums">({bonus.typeId})</span>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {bonus.value}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {bonus.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
