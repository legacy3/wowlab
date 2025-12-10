"use client";

import { useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { OnMount, OnChange, BeforeMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <CodeEditorSkeleton />,
});

export type EditorInstance = Monaco.editor.IStandaloneCodeEditor;
export type MonacoInstance = typeof Monaco;

export interface CodeEditorProps {
  value?: string;
  defaultValue?: string;
  language?: string;
  height?: string | number;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onMount?: (editor: EditorInstance, monaco: MonacoInstance) => void;
  beforeMount?: (monaco: MonacoInstance) => void;
  onValidate?: (markers: Monaco.editor.IMarker[]) => void;
  minimap?: boolean;
  lineNumbers?: boolean;
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded";
  fontSize?: number;
  tabSize?: number;
}

function CodeEditorSkeleton() {
  return <Skeleton className="h-[400px] w-full rounded-md" />;
}

export function CodeEditor({
  value,
  defaultValue,
  language = "typescript",
  height = 400,
  className,
  readOnly = false,
  disabled = false,
  autoFocus = false,
  onChange,
  onBlur,
  onMount,
  beforeMount,
  onValidate,
  minimap = false,
  lineNumbers = true,
  wordWrap = "on",
  fontSize = 13,
  tabSize = 2,
}: CodeEditorProps) {
  const editorRef = useRef<EditorInstance | null>(null);
  const monacoRef = useRef<MonacoInstance | null>(null);

  const handleBeforeMount: BeforeMount = useCallback(
    (monaco) => {
      monacoRef.current = monaco;
      beforeMount?.(monaco);
    },
    [beforeMount],
  );

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      if (autoFocus) {
        editor.focus();
      }

      if (onBlur) {
        editor.onDidBlurEditorWidget(() => onBlur());
      }

      onMount?.(editor, monaco);
    },
    [onMount, autoFocus, onBlur],
  );

  const handleChange: OnChange = useCallback(
    (newValue) => {
      onChange?.(newValue ?? "");
    },
    [onChange],
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border bg-muted/30",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <MonacoEditor
        height={height}
        language={language}
        value={value ?? ""}
        defaultValue={defaultValue}
        theme="vs-dark"
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        onValidate={onValidate}
        options={{
          readOnly: readOnly || disabled,
          minimap: { enabled: minimap },
          lineNumbers: lineNumbers ? "on" : "off",
          wordWrap,
          fontSize,
          tabSize,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          fontFamily: "var(--font-mono, 'Fira Code', Consolas, monospace)",
          fontLigatures: true,
          fixedOverflowWidgets: true,
          mouseStyle: "text",
        }}
      />
    </div>
  );
}

export function useCodeEditorRef() {
  const editorRef = useRef<EditorInstance | null>(null);
  const monacoRef = useRef<MonacoInstance | null>(null);

  const onMount = useCallback(
    (editor: EditorInstance, monaco: MonacoInstance) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
    },
    [],
  );

  return {
    editorRef,
    monacoRef,
    onMount,
    getValue: () => editorRef.current?.getValue() ?? "",
    setValue: (value: string) => editorRef.current?.setValue(value),
    focus: () => editorRef.current?.focus(),
    setPosition: (line: number, column = 1) => {
      editorRef.current?.setPosition({ lineNumber: line, column });
      editorRef.current?.revealLineInCenter(line);
    },
  };
}
