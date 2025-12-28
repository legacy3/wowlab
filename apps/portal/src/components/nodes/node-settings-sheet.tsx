"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Globe, Users, User, Lock, Trash2 } from "lucide-react";
import { useNodeManager, type NodeListItem } from "@/providers";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";
import { SecretText } from "@/components/ui/secret-field";

interface NodeSettingsSheetProps {
  node: NodeListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AccessType = "owner" | "friends" | "guild" | "public";

const accessOptions: {
  value: AccessType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "owner",
    label: "Only me",
    description: "Only you can use this node",
    icon: <Lock className="h-4 w-4" />,
  },
  {
    value: "friends",
    label: "Friends",
    description: "People on your friends list",
    icon: <User className="h-4 w-4" />,
  },
  {
    value: "guild",
    label: "Guild",
    description: "Members of your guild",
    icon: <Users className="h-4 w-4" />,
  },
  {
    value: "public",
    label: "Public",
    description: "Anyone can use this node",
    icon: <Globe className="h-4 w-4" />,
  },
];

export function NodeSettingsSheet({
  node,
  open,
  onOpenChange,
}: NodeSettingsSheetProps) {
  const {
    localNode,
    setLocalEnabled,
    setLocalConcurrency,
    getNodeAccess,
    updateNodeAccess,
    deleteNode,
  } = useNodeManager();

  const [accessType, setAccessType] = useState<AccessType>("owner");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const currentAccess =
    node && !node.isLocal ? getNodeAccess(node.id) : "owner";

  useEffect(() => {
    if (currentAccess) {
      setAccessType(currentAccess);
    }
  }, [currentAccess]);

  if (!node) {
    return null;
  }

  const maxConcurrency =
    typeof navigator !== "undefined" ? (navigator.hardwareConcurrency ?? 8) : 8;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {node.isLocal ? (
              node.name
            ) : (
              <SecretText
                value={node.name}
                hiddenLength={15}
              />
            )}
          </DialogTitle>
          <DialogDescription>
            {node.isLocal ? "Browser compute node" : "Remote compute node"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Local node: enabled toggle */}
          {node.isLocal && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Run simulations in browser
                </p>
              </div>
              <Switch
                checked={localNode.enabled}
                onCheckedChange={setLocalEnabled}
              />
            </div>
          )}

          {/* Concurrency slider (local only for now) */}
          {node.isLocal && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Workers</Label>
                <span className="text-sm font-medium">
                  {localNode.concurrency} / {maxConcurrency}
                </span>
              </div>
              <Slider
                value={[localNode.concurrency]}
                onValueChange={([value]) => setLocalConcurrency(value)}
                min={1}
                max={maxConcurrency}
                step={1}
                disabled={!localNode.enabled}
              />
            </div>
          )}

          {/* Access settings (remote only) */}
          {!node.isLocal && node.isOwner && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                Access
                {isSaving && <FlaskInlineLoader className="h-3 w-3" />}
              </Label>
              <RadioGroup
                value={accessType}
                onValueChange={(v) => handleAccessChange(v as AccessType)}
                className="grid grid-cols-2 gap-2"
                disabled={isSaving}
              >
                {accessOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
                    onClick={() => !isSaving && handleAccessChange(opt.value)}
                  >
                    <RadioGroupItem
                      value={opt.value}
                      id={opt.value}
                      className="sr-only"
                    />
                    {opt.icon}
                    <span className="text-sm">{opt.label}</span>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Delete button (remote only) */}
          {!node.isLocal && node.isOwner && (
            <div className="pt-3 border-t">
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
                    <Trash2 className="mr-2 h-3 w-3" />
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
