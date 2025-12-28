"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

  const handleSaveAccess = async () => {
    if (node.isLocal) {
      return;
    }
    setIsSaving(true);
    try {
      await updateNodeAccess(node.id, accessType);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteNode(node.id);
    onOpenChange(false);
  };

  const hasAccessChanges = currentAccess !== accessType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{node.name}</DialogTitle>
          <DialogDescription>
            {node.isLocal ? "Browser compute node" : "Remote compute node"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
            <div className="space-y-4">
              <Label>Who can use this node</Label>
              <RadioGroup
                value={accessType}
                onValueChange={(v) => setAccessType(v as AccessType)}
                className="space-y-2"
              >
                {accessOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => setAccessType(opt.value)}
                  >
                    <RadioGroupItem value={opt.value} id={opt.value} />
                    <div className="flex-1">
                      <Label
                        htmlFor={opt.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {opt.icon}
                        {opt.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {hasAccessChanges && (
                <Button
                  onClick={handleSaveAccess}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving && <FlaskInlineLoader className="mr-2 h-4 w-4" />}
                  Save Access Settings
                </Button>
              )}
            </div>
          )}

          {/* Delete button (remote only) */}
          {!node.isLocal && node.isOwner && (
            <div className="pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Node
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete node?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{node.name}&quot;. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
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
