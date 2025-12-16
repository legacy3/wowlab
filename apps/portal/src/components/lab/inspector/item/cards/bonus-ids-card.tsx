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
      <CardHeader>
        <CardTitle>Bonus IDs</CardTitle>
        <CardDescription>
          Current Bonus IDs: [{item.bonusIds.join(", ")}]
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {item.bonusBreakdown.map((bonus) => (
              <TableRow key={bonus.id}>
                <TableCell className="font-mono">{bonus.id}</TableCell>
                <TableCell>
                  {bonus.type} ({bonus.typeId})
                </TableCell>
                <TableCell className="font-mono">{bonus.value}</TableCell>
                <TableCell className="text-muted-foreground">
                  {bonus.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
