"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Globe, Users, User, Lock, Trash2, Power } from "lucide-react";
import { useNodeManager, type NodeListItem } from "@/providers";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";
import { useUpdate, useInvalidate } from "@refinedev/core";
import type { UserNode } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface NodeSettingsModalProps {
  node: NodeListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AccessType = "owner" | "friends" | "guild" | "public";

const accessOptions: {
  value: AccessType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "owner", label: "Only me", icon: <Lock className="h-4 w-4" /> },
  { value: "friends", label: "Friends", icon: <User className="h-4 w-4" /> },
  { value: "guild", label: "Guild", icon: <Users className="h-4 w-4" /> },
  { value: "public", label: "Public", icon: <Globe className="h-4 w-4" /> },
];

export function NodeSettingsModal({
  node,
  open,
  onOpenChange,
}: NodeSettingsModalProps) {
  const {
    localNode,
    setLocalEnabled,
    setLocalConcurrency,
    getNodeAccess,
    updateNodeAccess,
    deleteNode,
  } = useNodeManager();

  const { mutateAsync: updateNode } = useUpdate<UserNode>();
  const invalidate = useInvalidate();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [accessType, setAccessType] = useState<AccessType>("owner");
  const [remoteWorkers, setRemoteWorkers] = useState(node?.maxParallel ?? 1);
  const [nodeName, setNodeName] = useState(node?.name ?? "");
  const [isEnabled, setIsEnabled] = useState(node?.status === "online");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingWorkers, setIsSavingWorkers] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const currentAccess =
    node && !node.isLocal ? getNodeAccess(node.id) : "owner";

  useEffect(() => {
    if (currentAccess) {
      setAccessType(currentAccess);
    }
  }, [currentAccess]);

  useEffect(() => {
    if (node && !node.isLocal) {
      setRemoteWorkers(node.maxParallel);
      setNodeName(node.name);
      setIsEnabled(node.status === "online");
    }
  }, [node]);

  if (!node) {
    return null;
  }

  const maxConcurrency =
    typeof navigator !== "undefined" ? (navigator.hardwareConcurrency ?? 8) : 8;

  const handleRemoteWorkersChange = async (newWorkers: number) => {
    if (node.isLocal || newWorkers === node.maxParallel) {
      return;
    }
    setRemoteWorkers(newWorkers);
    setIsSavingWorkers(true);
    try {
      await updateNode({
        resource: "user_nodes",
        id: node.id,
        values: { maxParallel: newWorkers },
      });
      invalidate({ resource: "user_nodes", invalidates: ["list"] });
    } finally {
      setIsSavingWorkers(false);
    }
  };

  const handleNameChange = async (newName: string) => {
    if (node.isLocal || newName === node.name || !newName.trim()) {
      setNodeName(node.name);
      return;
    }
    setIsSavingName(true);
    try {
      await updateNode({
        resource: "user_nodes",
        id: node.id,
        values: { name: newName.trim() },
      });
      invalidate({ resource: "user_nodes", invalidates: ["list"] });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleStatusChange = async (enabled: boolean) => {
    if (node.isLocal) {
      return;
    }
    setIsEnabled(enabled);
    setIsSavingStatus(true);
    try {
      await updateNode({
        resource: "user_nodes",
        id: node.id,
        values: { status: enabled ? "online" : "offline" },
      });
      invalidate({ resource: "user_nodes", invalidates: ["list"] });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleAccessChange = async (newAccess: AccessType) => {
    if (node.isLocal || newAccess === currentAccess) {
      return;
    }
    setAccessType(newAccess);
    setIsSaving(true);
    try {
      await updateNodeAccess(node.id, newAccess);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteNode(node.id);
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
    onOpenChange(false);
  };

  const canDelete = deleteConfirmation === node.name;
  const effectiveEnabled = node.isLocal ? localNode.enabled : isEnabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Header with editable name */}
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-3">
            {node.isOwner && (
              <Toggle
                pressed={effectiveEnabled}
                onPressedChange={(pressed) => {
                  if (node.isLocal) {
                    setLocalEnabled(pressed);
                  } else {
                    handleStatusChange(pressed);
                  }
                }}
                disabled={isSavingStatus}
                variant="outline"
                size="sm"
                className={cn(
                  "shrink-0",
                  effectiveEnabled
                    ? "data-[state=on]:bg-green-500/10 data-[state=on]:text-green-500 data-[state=on]:border-green-500/30"
                    : "text-muted-foreground",
                )}
              >
                <Power className="h-4 w-4" />
              </Toggle>
            )}
            <div className="flex-1 min-w-0">
              {node.isLocal || !node.isOwner ? (
                <DialogTitle>{node.name}</DialogTitle>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    ref={nameInputRef}
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    onBlur={() => handleNameChange(nodeName)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleNameChange(nodeName);
                        nameInputRef.current?.blur();
                      }
                      if (e.key === "Escape") {
                        setNodeName(node.name);
                        nameInputRef.current?.blur();
                      }
                    }}
                    maxLength={50}
                    disabled={isSavingName}
                    tabIndex={-1}
                    className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 w-full truncate hover:bg-muted/50 focus:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                  />
                  {isSavingName && (
                    <FlaskInlineLoader className="h-4 w-4 shrink-0" />
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {node.platform} · v{node.version}
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Workers */}
          {node.isOwner && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Workers
                  {isSavingWorkers && <FlaskInlineLoader className="h-3 w-3" />}
                </Label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {node.isLocal ? localNode.concurrency : remoteWorkers} /{" "}
                  {node.isLocal ? maxConcurrency : node.totalCores}
                </span>
              </div>
              <Slider
                value={[node.isLocal ? localNode.concurrency : remoteWorkers]}
                onValueChange={([value]) => {
                  if (node.isLocal) {
                    setLocalConcurrency(value);
                  } else {
                    setRemoteWorkers(value);
                  }
                }}
                onValueCommit={([value]) => {
                  if (!node.isLocal) {
                    handleRemoteWorkersChange(value);
                  }
                }}
                min={1}
                max={node.isLocal ? maxConcurrency : node.totalCores}
                step={1}
                disabled={isSavingWorkers}
              />
            </div>
          )}

          {/* Access (remote only) */}
          {!node.isLocal && node.isOwner && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                Access
                {isSaving && <FlaskInlineLoader className="h-3 w-3" />}
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {accessOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => !isSaving && handleAccessChange(opt.value)}
                    disabled={isSaving}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors",
                      accessType === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delete (remote only) */}
          {!node.isLocal && node.isOwner && (
            <div className="pt-2">
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                  setDeleteDialogOpen(open);
                  if (!open) setDeleteConfirmation("");
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Node
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete node?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>
                          Type{" "}
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                            {node.name}
                          </code>{" "}
                          to confirm.
                        </p>
                        <Input
                          value={deleteConfirmation}
                          onChange={(e) =>
                            setDeleteConfirmation(e.target.value)
                          }
                          placeholder={node.name}
                          autoComplete="off"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={!canDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
