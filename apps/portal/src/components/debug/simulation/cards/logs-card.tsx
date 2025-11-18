"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { FileText } from "lucide-react";

interface LogsCardProps {
  logs: string[];
}

export function LogsCard({ logs }: LogsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayLogs = isExpanded ? logs : logs.slice(0, 10);
  const hasMore = logs.length > 10;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Execution Logs ({logs.length})
          </CardTitle>
          <div className="flex gap-2">
            {hasMore && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
              >
                {isExpanded ? "Show Less" : `Show All`}
              </button>
            )}
            <CopyButton value={logs.join("\n")} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No logs yet</p>
            <p className="text-xs mt-1">
              Run a simulation to see execution logs
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto bg-muted/30 rounded border">
            <div className="p-3 space-y-1">
              {displayLogs.map((log, index) => (
                <div
                  key={index}
                  className="font-mono text-xs text-muted-foreground py-1 border-b border-border/30 last:border-0"
                >
                  <span className="text-primary/60 mr-2">[{index}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>

            {!isExpanded && hasMore && (
              <div className="text-xs text-center text-muted-foreground py-2 border-t">
                ... {logs.length - 10} more logs
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
