"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useGetIdentity, useIsAuthenticated } from "@refinedev/core";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { useRotation, useRotationMutations } from "@/hooks/rotations";
import type {
  UserIdentity,
  RotationInsert,
  Rotation,
} from "@/lib/supabase/types";
import { MetadataSetup, type MetadataSubmitValues } from "./metadata-setup";
import { EditorView } from "./editor-view";
import type { SettingsValues } from "./settings-panel";

const DEFAULT_SCRIPT = `const cobraShot = yield* tryCast(rotation, playerId, SpellIds.COBRA_SHOT, targetId);
if (cobraShot.cast && cobraShot.consumedGCD) {
  return;
}
`;

interface RotationEditorProps {
  rotationId?: string;
  forkSourceId?: string;
}

function RotationEditorSkeleton() {
  return (
    <div className="flex flex-col h-[600px] rounded-lg border overflow-hidden">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="flex-1" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

// Draft rotation type for unsaved rotations
interface DraftRotation {
  name: string;
  slug: string;
  class: string;
  spec: string;
  description: string | null;
  script: string;
  isPublic: boolean;
}

function RotationEditorInner({
  rotationId,
  forkSourceId,
}: RotationEditorProps) {
  // Draft state for new/fork rotations (not yet saved to DB)
  const [draft, setDraft] = useState<DraftRotation | null>(null);
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [isTesting, setIsTesting] = useState(false);

  const { data: auth, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } =
    useGetIdentity<UserIdentity>();

  const {
    rotation: existingRotation,
    isLoading: isLoadingRotation,
    isError: isErrorRotation,
  } = useRotation(rotationId);

  const {
    rotation: forkSource,
    isLoading: isLoadingForkSource,
    isError: isErrorForkSource,
  } = useRotation(forkSourceId);

  const { createRotation, updateRotation, deleteRotation, isMutating } =
    useRotationMutations();

  const isEditMode = !!rotationId;
  const isForkMode = !!forkSourceId && !rotationId;
  const isNewMode = !rotationId && !forkSourceId;
  const isDraftMode = draft !== null && !isEditMode;

  // Sync script state when existing rotation loads
  useEffect(() => {
    if (isEditMode && existingRotation) {
      setScript(existingRotation.script);
    }
  }, [isEditMode, existingRotation]);

  // Handle metadata form submission - just store in local state, don't create yet
  const handleMetadataSubmit = (values: MetadataSubmitValues) => {
    // Priority: fork source script > selected template > default
    const initialScript = forkSource?.script ?? values.template.script;
    setDraft({
      name: values.name,
      slug: values.slug,
      class: values.class,
      spec: values.spec,
      description: values.description || null,
      script: initialScript,
      isPublic: false,
    });
    setScript(initialScript);
  };

  // Handle save - creates rotation if draft, updates if existing
  const handleSave = async () => {
    if (!identity?.id) return;

    if (isDraftMode && draft) {
      // First save - create the rotation
      const insertValues: RotationInsert = {
        userId: identity.id,
        name: draft.name,
        slug: draft.slug,
        class: draft.class,
        spec: draft.spec,
        script: script,
        description: draft.description,
        isPublic: draft.isPublic,
        forkedFromId: forkSourceId ?? null,
      };
      await createRotation(insertValues);
      // createRotation redirects to /rotations/editor/[id] on success
    } else if (isEditMode && rotationId) {
      // Update existing rotation
      await updateRotation(rotationId, { script });
    }
  };

  // Handle test button
  const handleTest = async () => {
    setIsTesting(true);
    // TODO: Wire up simulation here
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsTesting(false);
  };

  // Handle settings update from zen editor (only for existing rotations)
  const handleSettingsChange = async (values: SettingsValues) => {
    if (isDraftMode && draft) {
      // Update draft in memory
      setDraft({
        ...draft,
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        isPublic: values.isPublic,
      });
    } else if (isEditMode && rotationId) {
      // Update in database
      await updateRotation(rotationId, {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        isPublic: values.isPublic,
      });
    }
  };

  // Handle delete (only for existing rotations)
  const handleDelete = async () => {
    if (rotationId) {
      await deleteRotation(rotationId);
    }
  };

  // Auth loading
  if (authLoading || identityLoading) {
    return <RotationEditorSkeleton />;
  }

  // Not authenticated
  if (!auth?.authenticated || !identity) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <LogIn className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-semibold mb-2">Sign in required</p>
          <p className="text-sm text-muted-foreground mb-6">
            Please sign in to create or edit rotations
          </p>
          <Button asChild>
            <Link href="/auth/sign-in">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading existing rotation
  if (isEditMode && isLoadingRotation) {
    return <RotationEditorSkeleton />;
  }

  // Loading fork source
  if (isForkMode && isLoadingForkSource) {
    return <RotationEditorSkeleton />;
  }

  // Rotation not found
  if (isEditMode && (isErrorRotation || !existingRotation)) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">Rotation Not Found</p>
        <p className="text-sm text-muted-foreground">
          The rotation you&apos;re trying to edit doesn&apos;t exist or has been
          deleted
        </p>
      </div>
    );
  }

  // Fork source not found
  if (isForkMode && (isErrorForkSource || !forkSource)) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">Source Rotation Not Found</p>
        <p className="text-sm text-muted-foreground">
          The rotation you&apos;re trying to fork doesn&apos;t exist or has been
          deleted
        </p>
      </div>
    );
  }

  // Check ownership for edit mode
  const isOwner = existingRotation?.userId === identity?.id;
  if (isEditMode && !isOwner) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          You do not have permission to edit this rotation
        </p>
      </div>
    );
  }

  // NEW/FORK MODE without draft: Show metadata setup
  if ((isNewMode || isForkMode) && !draft) {
    const defaultValues =
      isForkMode && forkSource
        ? {
            name: `${forkSource.name} (Fork)`,
            slug: `${forkSource.slug}-fork`,
            class: forkSource.class,
            spec: forkSource.spec,
            description: forkSource.description ?? "",
          }
        : undefined;

    return (
      <div className="py-8">
        <MetadataSetup
          defaultValues={defaultValues}
          onSubmit={handleMetadataSubmit}
        />
      </div>
    );
  }

  // DRAFT MODE: Show zen editor with draft rotation (not yet saved)
  if (isDraftMode && draft) {
    // Create a fake rotation object for the zen editor
    const draftAsRotation: Rotation = {
      id: "",
      userId: identity.id,
      name: draft.name,
      slug: draft.slug,
      class: draft.class,
      spec: draft.spec,
      script: draft.script,
      description: draft.description,
      isPublic: draft.isPublic,
      forkedFromId: forkSourceId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return (
      <EditorView
        rotation={draftAsRotation}
        script={script}
        isSaving={isMutating}
        isTesting={isTesting}
        isDraft={true}
        onScriptChange={setScript}
        onSave={handleSave}
        onTest={handleTest}
        onSettingsChange={handleSettingsChange}
      />
    );
  }

  // EDIT MODE: Show editor with existing rotation
  if (isEditMode && existingRotation) {
    return (
      <EditorView
        rotation={existingRotation}
        script={script}
        isSaving={isMutating}
        isTesting={isTesting}
        isDraft={false}
        onScriptChange={setScript}
        onSave={handleSave}
        onTest={handleTest}
        onSettingsChange={handleSettingsChange}
        onDelete={handleDelete}
      />
    );
  }

  return null;
}

export function RotationEditor(props: RotationEditorProps) {
  return (
    <Suspense fallback={<RotationEditorSkeleton />}>
      <RotationEditorInner {...props} />
    </Suspense>
  );
}

export type { MetadataFormValues as RotationFormValues } from "./metadata-setup";
