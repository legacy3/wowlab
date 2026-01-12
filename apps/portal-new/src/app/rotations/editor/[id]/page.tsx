"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Center } from "styled-system/jsx";

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
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h="100vh">
        <Text color="fg.error">
          Failed to load rotation: {error?.message ?? "Unknown error"}
        </Text>
      </Center>
    );
  }

  if (!rotation) {
    return (
      <Center h="100vh">
        <Text color="fg.muted">Rotation not found</Text>
      </Center>
    );
  }

  return <EditorPage />;
}
