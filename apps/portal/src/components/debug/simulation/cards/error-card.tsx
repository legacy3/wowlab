"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { AlertCircle } from "lucide-react";

interface ErrorCardProps {
  error: string | null;
}

export function ErrorCard({ error }: ErrorCardProps) {
  const [showFullError, setShowFullError] = useState(false);

  if (!error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            Errors
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            No errors yet - all clear!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Errors will appear here if the simulation fails
          </p>
        </CardContent>
      </Card>
    );
  }

  // Parse structured error info
  const parseError = (errorStr: string) => {
    try {
      if (errorStr.includes("Simulation failed:")) {
        const parts = errorStr.split("\n\n");
        const mainMessage = parts[1] || errorStr;
        const failures = parts.find((p) => p.startsWith("Failures:")) || null;
        const defects = parts.find((p) => p.startsWith("Defects:")) || null;

        return {
          message: mainMessage,
          failures,
          defects,
          hasStructuredInfo: true,
        };
      }
    } catch {
      // Fall through
    }

    return {
      message: errorStr,
      failures: null,
      defects: null,
      hasStructuredInfo: false,
    };
  };

  const parsed = parseError(error);

  return (
    <Card className="border-red-500/20 bg-red-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
          <div className="flex gap-2">
            {parsed.hasStructuredInfo && (
              <button
                onClick={() => setShowFullError(!showFullError)}
                className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded transition-colors"
              >
                {showFullError ? "Hide Details" : "Show Details"}
              </button>
            )}
            <CopyButton value={error} />
          </div>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Check browser console for detailed error logs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="text-red-600 dark:text-red-400 font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto p-3 bg-background/50 rounded border">
          {parsed.message}
        </pre>

        {showFullError && parsed.hasStructuredInfo && (
          <div className="space-y-3 pt-3 border-t border-red-500/20">
            {parsed.failures && (
              <div>
                <h5 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                  Expected Failures:
                </h5>
                <pre className="text-red-600 dark:text-red-400 font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto p-3 bg-background/50 rounded border">
                  {parsed.failures}
                </pre>
              </div>
            )}

            {parsed.defects && (
              <div>
                <h5 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                  Unexpected Defects:
                </h5>
                <pre className="text-red-600 dark:text-red-400 font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto p-3 bg-background/50 rounded border">
                  {parsed.defects}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border">
          <p className="font-semibold mb-1">Debug Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Expected failures are recoverable errors</li>
            <li>Defects are unexpected errors that should be fixed</li>
            <li>Interruptions indicate fiber cancellations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
