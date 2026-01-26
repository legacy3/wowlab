"use client";

import { useEffect } from "react";

import { EditorContent } from "@/components/editor";
import { useEditor } from "@/lib/state/editor";

export default function NewRotationPage() {
  const reset = useEditor((s) => s.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  return <EditorContent />;
}
