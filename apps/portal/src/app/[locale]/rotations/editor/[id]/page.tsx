"use client";

import { useIntlayer } from "next-intlayer";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { ErrorBox, Loader, PageLoader, Text } from "@/components/ui";
import { useLoadRotation } from "@/lib/state";

const EditorContent = dynamic(
  () =>
    import("@/components/editor/layout/editor-content").then(
      (m) => m.EditorContent,
    ),
  { loading: () => <PageLoader message="Loading WASM..." />, ssr: false },
);

export default function EditRotationPage() {
  const { page: content } = useIntlayer("editor");
  const params = useParams<{ id: string }>();
  const id = params.id;
  const loadedIdRef = useRef<string | null>(null);

  const { error, isError, isLoading, loadIntoEditor, rotation } =
    useLoadRotation(id);

  useEffect(() => {
    if (rotation && loadedIdRef.current !== rotation.id) {
      loadedIdRef.current = rotation.id;
      loadIntoEditor();
    }
  }, [rotation, loadIntoEditor]);

  if (isLoading) {
    return <Loader size="lg" />;
  }

  if (isError) {
    return (
      <ErrorBox>
        {content.failedToLoadRotation} {error?.message ?? content.unknownError}
      </ErrorBox>
    );
  }

  if (!rotation) {
    return <Text color="fg.muted">{content.rotationNotFound}</Text>;
  }

  return <EditorContent />;
}
