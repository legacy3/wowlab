"use client";

import { useExtracted } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { EditorPage } from "@/components/editor";
import { ErrorBox, Loader, Text } from "@/components/ui";
import { useLoadRotation } from "@/lib/state/rotation";

export default function EditRotationPage() {
  const t = useExtracted();
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
        {t("Failed to load rotation:")} {error?.message ?? t("Unknown error")}
      </ErrorBox>
    );
  }

  if (!rotation) {
    return <Text color="fg.muted">{t("Rotation not found")}</Text>;
  }

  return <EditorPage />;
}
