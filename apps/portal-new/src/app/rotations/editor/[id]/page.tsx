"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { EditorPage } from "@/components/editor";
import { Loader, Text } from "@/components/ui";
import { useLoadRotation } from "@/lib/state/rotation";

export default function EditRotationPage() {
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
      <Text color="fg.error">
        Failed to load rotation: {error?.message ?? "Unknown error"}
      </Text>
    );
  }

  if (!rotation) {
    return <Text color="fg.muted">Rotation not found</Text>;
  }

  return <EditorPage />;
}
