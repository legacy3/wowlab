"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ResourcesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Resources</CardTitle>
        <CardDescription>Current computing capacity usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>CPU Usage</span>
            <span className="font-medium">67%</span>
          </div>
          <Progress value={67} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Memory Usage</span>
            <span className="font-medium">4.2 GB / 8 GB</span>
          </div>
          <Progress value={52.5} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Worker Threads</span>
            <span className="font-medium">6 / 8 active</span>
          </div>
          <Progress value={75} />
        </div>
      </CardContent>
    </Card>
  );
}
