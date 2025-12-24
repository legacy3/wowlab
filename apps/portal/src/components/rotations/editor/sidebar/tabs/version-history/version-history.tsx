"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  RotateCcw,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DiffView } from "@/components/ui/diff-view";
import {
  useRotationHistory,
  useRotationHistoryVersion,
} from "@/hooks/rotations";

interface VersionHistoryProps {
  rotationId: string | undefined;
  currentVersion: number | undefined;
  currentScript: string;
  onRestore: (script: string) => void;
}

export function VersionHistory({
  rotationId,
  currentVersion,
  currentScript,
  onRestore,
}: VersionHistoryProps) {
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const { data: versions, isLoading } = useRotationHistory(rotationId);
  const { data: versionScript, isLoading: isLoadingScript } =
    useRotationHistoryVersion(rotationId, viewingVersion ?? undefined);

  if (!rotationId) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Save the rotation to start tracking versions
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No version history yet</p>
        <p className="text-xs mt-1">
          Versions are saved automatically when you edit
        </p>
      </div>
    );
  }

  const handleRestore = () => {
    if (versionScript) {
      onRestore(versionScript);
      setViewingVersion(null);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          {versions.length} version{versions.length !== 1 ? "s" : ""} saved
        </div>
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 pr-3">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => setViewingVersion(version.version)}
                className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    Version {version.version}
                  </span>
                  <Eye className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {version.createdAt
                    ? formatDistanceToNow(new Date(version.createdAt), {
                        addSuffix: true,
                      })
                    : "Unknown date"}
                </div>
                {version.message && (
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {version.message}
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Dialog
        open={viewingVersion !== null}
        onOpenChange={(open) => !open && setViewingVersion(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Version {viewingVersion}</DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Previous version (←)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[4rem] text-center">
                  1 / 2
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Next version (→)"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogDescription>
              Review this version and optionally restore it to the editor
            </DialogDescription>
          </DialogHeader>

          {isLoadingScript ? (
            <div className="flex items-center justify-center h-[400px] border rounded-md">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DiffView
              oldText={versionScript ?? ""}
              newText={currentScript}
              oldLabel={`Version ${viewingVersion}`}
              newLabel="Current"
            />
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewingVersion(null)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={!versionScript}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore to Editor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
