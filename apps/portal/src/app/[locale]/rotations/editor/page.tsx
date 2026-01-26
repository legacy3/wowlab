"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { PageLoader } from "@/components/ui";
import { useEditor } from "@/lib/state/editor";

const EditorContent = dynamic(
  () =>
    import("@/components/editor/layout/editor-content").then(
      (m) => m.EditorContent,
    ),
  { loading: () => <PageLoader message="Loading WASM..." />, ssr: false },
);

export default function NewRotationPage() {
  const reset = useEditor((s) => s.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  return <EditorContent />;
}
