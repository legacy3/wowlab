"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

  // Get sorted version numbers for navigation
  const versionNumbers = useMemo(() => {
    if (!versions) {
      return [];
    }
    return versions.map((v) => v.version).sort((a, b) => b - a);
  }, [versions]);

  // Current position in version list (1-indexed for display)
  const currentIndex = viewingVersion
    ? versionNumbers.indexOf(viewingVersion)
    : -1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < versionNumbers.length - 1;

  const goToPrevVersion = useCallback(() => {
    if (canGoPrev) {
      setViewingVersion(versionNumbers[currentIndex - 1]);
    }
  }, [canGoPrev, currentIndex, versionNumbers]);

  const goToNextVersion = useCallback(() => {
    if (canGoNext) {
      setViewingVersion(versionNumbers[currentIndex + 1]);
    }
  }, [canGoNext, currentIndex, versionNumbers]);

  // Keyboard navigation for version dialog
  useEffect(() => {
    if (viewingVersion === null) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevVersion();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextVersion();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingVersion, goToPrevVersion, goToNextVersion]);

  const handleRestore = useCallback(() => {
    if (versionScript) {
      onRestore(versionScript);
      setViewingVersion(null);
    }
  }, [versionScript, onRestore]);

  const closeDialog = useCallback(() => {
    setViewingVersion(null);
  }, []);

  if (!rotationId) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-8 w-8 mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Save the rotation to start tracking versions
        </p>
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
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-8 w-8 mb-3 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          No version history yet
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Versions are created when you save changes
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="font-medium">
            {versions.length} version{versions.length !== 1 ? "s" : ""}
          </span>
          {currentVersion && (
            <span className="text-muted-foreground/70">
              Current: v{currentVersion}
            </span>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-1 pr-2">
            {versions.map((version) => {
              const isCurrent = version.version === currentVersion;
              return (
                <button
                  key={version.id}
                  onClick={() => setViewingVersion(version.version)}
                  className="w-full text-left p-2.5 rounded-md hover:bg-muted/50 transition-colors group border border-transparent hover:border-border/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        v{version.version}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          current
                        </span>
                      )}
                    </div>
                    <Eye className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {version.createdAt
                      ? formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                        })
                      : "Unknown date"}
                  </div>
                  {version.message && (
                    <div className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-2">
                      {version.message}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={viewingVersion !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Version {viewingVersion}</DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goToPrevVersion}
                  disabled={!canGoPrev || isLoadingScript}
                  title="Newer version (←)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[4rem] text-center tabular-nums">
                  {currentIndex + 1} / {versionNumbers.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goToNextVersion}
                  disabled={!canGoNext || isLoadingScript}
                  title="Older version (→)"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogDescription>
              Compare this version with your current script. Use arrow keys to
              navigate.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 my-4">
            {isLoadingScript ? (
              <div className="flex items-center justify-center h-[400px] border rounded-md bg-muted/30">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DiffView
                oldText={versionScript ?? ""}
                newText={currentScript}
                oldLabel={`Version ${viewingVersion}`}
                newLabel="Current"
                className="h-full"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              disabled={!versionScript || isLoadingScript}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore to Editor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
