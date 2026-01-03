"use client";

import { useMemo } from "react";
import { Download, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { WindowsIcon, AppleIcon, LinuxIcon, DockerIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  PLATFORM_INFO,
  getNodeDownloadUrl,
  type NodePlatform,
  type PlatformInfo,
} from "@/lib/config/downloads";
import { env } from "@/lib/env";
import { useDetectedPlatform } from "@/hooks/use-detected-platform";

interface NodeDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLATFORM_ICONS: Record<
  NodePlatform,
  React.ComponentType<{ className?: string }>
> = {
  windows: WindowsIcon,
  macos: AppleIcon,
  linux: LinuxIcon,
  "linux-arm": LinuxIcon,
};

function PlatformCard({
  platform,
  isDetected,
}: {
  platform: PlatformInfo;
  isDetected: boolean;
}) {
  const Icon = PLATFORM_ICONS[platform.id];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-3 rounded-lg border p-4",
        isDetected && "border-primary bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      {isDetected && (
        <Badge
          variant="default"
          className="absolute -top-2 left-3 text-[10px] px-1.5 py-0"
        >
          Detected
        </Badge>
      )}
      <Icon className="h-8 w-8" />
      <div className="text-center">
        <div className="font-medium">{platform.name}</div>
        <div className="text-xs text-muted-foreground">{platform.arch}</div>
      </div>
      <div className="flex gap-2 w-full">
        <Button size="sm" className="flex-1" asChild>
          <a
            href={getNodeDownloadUrl(platform.id, "gui")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Desktop
          </a>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a
            href={getNodeDownloadUrl(platform.id, "headless")}
            target="_blank"
            rel="noopener noreferrer"
            title="Command-line only"
          >
            <Terminal className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export function NodeDownloadModal({
  open,
  onOpenChange,
}: NodeDownloadModalProps) {
  const detectedPlatform = useDetectedPlatform();

  const sortedPlatforms = useMemo(() => {
    if (!detectedPlatform) return PLATFORM_INFO;
    return [
      ...PLATFORM_INFO.filter((p) => p.id === detectedPlatform),
      ...PLATFORM_INFO.filter((p) => p.id !== detectedPlatform),
    ];
  }, [detectedPlatform]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Get the Node</DialogTitle>
          <DialogDescription>
            Run local simulations or share compute with others
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {sortedPlatforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              isDetected={platform.id === detectedPlatform}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t">
          <DockerIcon className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Docker</div>
            <div className="text-xs text-muted-foreground">
              Multi-arch container for servers
            </div>
          </div>
          <Button size="sm" variant="outline" asChild>
            <a href={env.DOCKER_URL} target="_blank" rel="noopener noreferrer">
              View
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
