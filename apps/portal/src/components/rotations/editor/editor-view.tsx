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
  Sparkles,
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
import { RotationEditorTour } from "@/components/tours";

interface EditorViewProps {
  rotation: Rotation;
  script: string;
  isSaving: boolean;
  isTesting: boolean;
  isDraft: boolean;
  hasChanges: boolean;
  onScriptChange: (script: string) => void;
  onSave: () => void;
  onTest: () => void;
  onSettingsChange: (values: SettingsValues) => void;
  onDelete?: () => void;
}

function EditorSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] p-4 gap-3">
      <div className="flex gap-2">
        <Skeleton className="h-4 w-16 bg-zinc-700/50" />
        <Skeleton className="h-4 w-24 bg-zinc-700/50" />
      </div>
      <Skeleton className="h-4 w-48 bg-zinc-700/50" />
      <Skeleton className="h-4 w-32 bg-zinc-700/50" />
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-4 w-8 bg-zinc-700/50" />
        <Skeleton className="h-4 w-64 bg-zinc-700/50" />
      </div>
      <Skeleton className="h-4 w-40 bg-zinc-700/50" />
      <Skeleton className="h-4 w-56 bg-zinc-700/50" />
    </div>
  );
}

export function EditorView({
  rotation,
  script,
  isSaving,
  isTesting,
  isDraft,
  hasChanges,
  onScriptChange,
  onSave,
  onTest,
  onSettingsChange,
  onDelete,
}: EditorViewProps) {
  const { isZen, toggleZen } = useZenMode();
  const [editorReady, setEditorReady] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
          text,
          forceMoveMarkers: true,
        },
      ]);

      editor.focus();
    },
    [editorRef],
  );

  const handleFormat = useCallback(async () => {
    const editor = editorRef.editorRef.current;
    if (!editor) {
      return;
    }

    try {
      const prettier = await import("prettier/standalone");
      const estreePlugin = await import("prettier/plugins/estree");
      const tsPlugin = await import("prettier/plugins/typescript");

      const formatted = await prettier.format(script, {
        parser: "typescript",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins: [estreePlugin, tsPlugin] as any,
        semi: true,
        singleQuote: false,
        tabWidth: 2,
        trailingComma: "all",
      });

      onScriptChange(formatted);
    } catch {
      // Format failed, ignore
    }
  }, [script, onScriptChange, editorRef]);

  const handleSettingsSave = useCallback(
    (values: SettingsValues) => {
      onSettingsChange(values);
      setSettingsOpen(false);
    },
    [onSettingsChange],
  );

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
            data-tour="rotation-editor-sidebar-toggle"
          >
            <PanelRight className="h-4 w-4" />
          </Button>

          <Button
            variant={isZen ? "secondary" : "ghost"}
            size="sm"
            onClick={toggleZen}
            title={isZen ? "Exit zen mode (ESC)" : "Zen mode"}
            data-tour="rotation-editor-zen"
          >
            {isZen ? <X className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </Button>

          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                data-tour="rotation-editor-settings"
              >
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
                onSave={handleSettingsSave}
                onDelete={onDelete}
                isDisabled={isDisabled}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/20 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5"
          onClick={handleFormat}
          disabled={isDisabled}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Format
        </Button>
      </div>

      {/* Editor + Sidebar */}
      <div className="flex-1 min-h-0 flex">
        {/* Editor */}
        <div
          className="flex-1 min-w-0 relative"
          data-tour="rotation-editor-code"
        >
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
        {showSidebar && (
          <EditorSidebar
            onInsert={handleInsert}
            rotationId={rotation.id}
            currentVersion={rotation.currentVersion ?? undefined}
            currentScript={script}
            onRestore={onScriptChange}
            data-tour="rotation-editor-sidebar"
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 border-t px-4 py-2.5 bg-muted/30 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isDisabled || (!isDraft && !hasChanges)}
          data-tour="rotation-editor-save"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isDraft ? "Create" : "Save"}
        </Button>
        <Button
          size="sm"
          onClick={onTest}
          disabled={isDisabled}
          data-tour="rotation-editor-test"
        >
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Test
        </Button>
      </div>

      <RotationEditorTour show />
    </div>
  );
}
