"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Swords } from "lucide-react";
import { useItemData } from "../item-context";

export function SpecUsabilityCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5" />
          Spec Usability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">Primary Stat Users</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Specs Using Intellect Cloth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.specUsability.primaryStatUsers.map((classInfo) => (
                <TableRow key={classInfo.className}>
                  <TableCell>{classInfo.className}</TableCell>
                  <TableCell>
                    {classInfo.specs.map((spec, i) => (
                      <span key={spec.name}>
                        {i > 0 && ", "}
                        <span
                          className={
                            spec.usable ? "text-green-500" : "text-red-500"
                          }
                        >
                          {spec.usable ? "✓" : "✗"} {spec.name}
                        </span>
                      </span>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium">Stat Priority Match:</h4>
          <ul className="space-y-1 text-sm">
            {item.specUsability.statPriorityMatch.map((match) => (
              <li key={match.spec} className="flex items-center gap-2">
                <span>{match.spec}:</span>
                <span className="text-yellow-500">
                  {"★".repeat(match.rating)}
                  {"☆".repeat(5 - match.rating)}
                </span>
                <span className="text-muted-foreground">({match.note})</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
