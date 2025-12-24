"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DiffView, useDiffStats } from "@/components/ui/diff-view";
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

  const stats = useDiffStats(versionScript ?? "", currentScript);

  const versionNumbers = useMemo(() => {
    if (!versions) {
      return [];
    }
    return versions.map((v) => v.version).sort((a, b) => b - a);
  }, [versions]);

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

  if (!rotationId) {
    return <EmptyState icon={Clock} title="Save to track versions" />;
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
      <EmptyState
        icon={Clock}
        title="No versions yet"
        subtitle="Versions are created on save"
      />
    );
  }

  return (
    <>
      <div className="space-y-1">
        {versions.map((version) => {
          const isCurrent = version.version === currentVersion;
          return (
            <button
              key={version.id}
              onClick={() => setViewingVersion(version.version)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm tabular-nums">
                  v{version.version}
                </span>
                {isCurrent && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary">
                    current
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {version.createdAt
                    ? formatDistanceToNow(new Date(version.createdAt), {
                        addSuffix: true,
                      })
                    : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog
        open={viewingVersion !== null}
        onOpenChange={(open) => !open && setViewingVersion(null)}
      >
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="flex-row items-center gap-3 px-4 py-3 border-b shrink-0">
            <DialogTitle className="font-mono">v{viewingVersion}</DialogTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={goToPrevVersion}
                disabled={!canGoPrev || isLoadingScript}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums min-w-[3rem] text-center">
                {currentIndex + 1}/{versionNumbers.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={goToNextVersion}
                disabled={!canGoNext || isLoadingScript}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {!isLoadingScript &&
              (stats.additions > 0 || stats.deletions > 0) && (
                <span className="text-xs tabular-nums ml-auto mr-8">
                  <span className="text-green-400">+{stats.additions}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-red-400">-{stats.deletions}</span>
                </span>
              )}
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            {isLoadingScript ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DiffView
                oldText={versionScript ?? ""}
                newText={currentScript}
                className="h-full"
              />
            )}
          </div>

          <div className="flex justify-end px-4 py-2 border-t shrink-0">
            <Button
              size="sm"
              onClick={handleRestore}
              disabled={!versionScript || isLoadingScript}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Restore this version
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-6 w-6 mb-2 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground/60 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
