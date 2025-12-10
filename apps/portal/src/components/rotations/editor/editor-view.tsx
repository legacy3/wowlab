"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Expand,
  Loader2,
  PanelRight,
  Play,
  Save,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CodeEditor,
  useCodeEditorRef,
  type MonacoInstance,
} from "@/components/ui/code-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useZenMode } from "@/hooks/use-zen-mode";
import { SettingsPanel, type SettingsValues } from "./settings-panel";
import { EditorSidebar } from "./sidebar";
import type { Rotation } from "@/lib/supabase/types";

interface EditorViewProps {
  rotation: Rotation;
  script: string;
  isSaving: boolean;
  isTesting: boolean;
  isDraft: boolean;
  onScriptChange: (script: string) => void;
  onSave: () => void;
  onTest: () => void;
  onSettingsChange: (values: SettingsValues) => void;
  onDelete?: () => void;
}

function EditorSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] p-4 gap-2">
      <Skeleton className="h-4 w-32 bg-zinc-700" />
      <Skeleton className="h-4 w-48 bg-zinc-700" />
      <Skeleton className="h-4 w-24 bg-zinc-700" />
      <Skeleton className="h-4 w-64 bg-zinc-700" />
      <Skeleton className="h-4 w-40 bg-zinc-700" />
    </div>
  );
}

export function EditorView({
  rotation,
  script,
  isSaving,
  isTesting,
  isDraft,
  onScriptChange,
  onSave,
  onTest,
  onSettingsChange,
  onDelete,
}: EditorViewProps) {
  const { isZen, toggleZen } = useZenMode();
  const [editorReady, setEditorReady] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const editorRef = useCodeEditorRef();

  const handleBeforeMount = useCallback((monaco: MonacoInstance) => {
    monaco.typescript.typescriptDefaults.setCompilerOptions({ noLib: true });
  }, []);

  const handleMount = useCallback(
    (...args: Parameters<typeof editorRef.onMount>) => {
      editorRef.onMount(...args);
      setEditorReady(true);
    },
    [editorRef],
  );

  /* eslint-disable react-hooks/preserve-manual-memoization -- ref.current access pattern is intentional */
  const handleInsert = useCallback(
    (text: string) => {
      const editor = editorRef.editorRef.current;
      if (!editor) {
        return;
      }

      const selection = editor.getSelection();
      if (!selection) {
        return;
      }

      editor.executeEdits("insert", [
        {
          range: selection,
          text: text,
          forceMoveMarkers: true,
        },
      ]);

      editor.focus();
    },
    [editorRef],
  );
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const isDisabled = isSaving || isTesting;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border overflow-hidden",
        isZen
          ? "fixed inset-0 z-50 bg-background animate-in fade-in duration-200 rounded-none border-0"
          : "h-[calc(100dvh-10rem)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2 shrink-0 bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/rotations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-sm font-medium">{rotation.name}</h1>
            <p className="text-xs text-muted-foreground">
              {rotation.class} · {rotation.spec}
              {isZen && <span className="ml-2 opacity-60">(ESC to exit)</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={showSidebar ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            title={showSidebar ? "Hide sidebar" : "Show sidebar"}
          >
            <PanelRight className="h-4 w-4" />
          </Button>

          <Button
            variant={isZen ? "secondary" : "ghost"}
            size="sm"
            onClick={toggleZen}
            title={isZen ? "Exit zen mode (ESC)" : "Zen mode"}
          >
            {isZen ? <X className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rotation Settings</DialogTitle>
                <DialogDescription>
                  Update rotation metadata and visibility
                </DialogDescription>
              </DialogHeader>
              <SettingsPanel
                rotation={rotation}
                onSave={onSettingsChange}
                onDelete={onDelete}
                isDisabled={isDisabled}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Editor + Sidebar */}
      <div className="flex-1 min-h-0 flex">
        {/* Editor */}
        <div className="flex-1 min-w-0 relative">
          {!editorReady && <EditorSkeleton />}
          <div
            className={cn(
              "h-full",
              !editorReady && "invisible absolute inset-0",
            )}
          >
            <CodeEditor
              value={script}
              onChange={onScriptChange}
              beforeMount={handleBeforeMount}
              onMount={handleMount}
              language="typescript"
              height="100%"
              className="rounded-none border-0 h-full"
            />
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && <EditorSidebar onInsert={handleInsert} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-3 border-t px-4 py-3 bg-muted/30 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isDisabled}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isDraft ? "Create" : "Save"}
        </Button>
        <Button size="sm" onClick={onTest} disabled={isDisabled}>
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Test
        </Button>
      </div>
    </div>
  );
}
