"use client";

import { useIntlayer } from "next-intlayer";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { EditorContent } from "@/components/editor";
import { ErrorBox, Loader, Text } from "@/components/ui";
import { useLoadRotation } from "@/lib/state";

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
