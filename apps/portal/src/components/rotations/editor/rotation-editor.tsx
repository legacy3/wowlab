"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useGetIdentity, useIsAuthenticated } from "@refinedev/core";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRotation,
  useRotationMutations,
  useWorkerSimulation,
} from "@/hooks/rotations";
import type {
  UserIdentity,
  RotationInsert,
  Rotation,
} from "@/lib/supabase/types";
import { formatIsoTimestamp } from "@/lib/format";
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

export function RotationEditorSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] rounded-lg border overflow-hidden bg-background">
      <Skeleton className="h-12 w-full rounded-none" />
      <Skeleton className="flex-1 rounded-none" />
      <Skeleton className="h-14 w-full rounded-none" />
    </div>
  );
}

// Draft rotation type for unsaved rotations
interface DraftRotation {
  name: string;
  slug: string;
  specId: number;
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

  // Worker simulation hook
  const {
    run: runWorkerSimulation,
    isRunning: isTesting,
    stats: testStats,
    error: testError,
  } = useWorkerSimulation({
    onComplete: (stats) => {
      toast.success(
        `Simulation complete: ${stats.completedSims} iterations, ${stats.totalCasts} total casts`,
      );
    },
    onError: (error) => {
      toast.error(`Simulation failed: ${error.message}`);
    },
  });

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
      specId: values.specId,
      description: values.description || null,
      script: initialScript,
      isPublic: false,
    });
    setScript(initialScript);
  };

  const handleSave = async () => {
    if (!identity?.id) {
      return;
    }

    if (isDraftMode && draft) {
      const insertValues: RotationInsert = {
        userId: identity.id,
        name: draft.name,
        slug: draft.slug,
        specId: draft.specId,
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

  // Handle test button - runs simulation via worker pool
  const handleTest = useCallback(async () => {
    const rotationName =
      draft?.name ?? existingRotation?.name ?? "Untitled Rotation";

    try {
      await runWorkerSimulation({
        code: script,
        name: rotationName,
        iterations: 10, // Quick test with 10 iterations
        duration: 30, // 30 second fight
      });
    } catch {
      // Error already handled by onError callback
    }
  }, [script, draft?.name, existingRotation?.name, runWorkerSimulation]);

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

  // Auth loading (server already verified user is logged in)
  if (authLoading || identityLoading || !identity) {
    return <RotationEditorSkeleton />;
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
            specId: forkSource.specId,
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
      specId: draft.specId,
      script: draft.script,
      description: draft.description,
      isPublic: draft.isPublic,
      forkedFromId: forkSourceId ?? null,
      createdAt: formatIsoTimestamp(),
      updatedAt: formatIsoTimestamp(),
      currentVersion: 1,
    };

    return (
      <EditorView
        rotation={draftAsRotation}
        script={script}
        isSaving={isMutating}
        isTesting={isTesting}
        isDraft={true}
        hasChanges={true}
        onScriptChange={setScript}
        onSave={handleSave}
        onTest={handleTest}
        onSettingsChange={handleSettingsChange}
      />
    );
  }

  // EDIT MODE: Show editor with existing rotation
  if (isEditMode && existingRotation) {
    const hasChanges = script !== existingRotation.script;

    return (
      <EditorView
        rotation={existingRotation}
        script={script}
        isSaving={isMutating}
        isTesting={isTesting}
        isDraft={false}
        hasChanges={hasChanges}
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
