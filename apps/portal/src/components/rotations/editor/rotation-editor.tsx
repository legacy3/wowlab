"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetIdentity, useIsAuthenticated } from "@refinedev/core";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { useRotation, useRotationMutations } from "@/hooks/rotations";
import type { UserIdentity, RotationInsert } from "@/lib/supabase/types";
import { RotationMetadataCard } from "./cards/rotation-metadata-card";
import { RotationScriptCard } from "./cards/rotation-script-card";

const rotationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  class: z.string().min(1, "Class is required"),
  spec: z.string().min(1, "Spec is required"),
  script: z.string().min(1, "Script is required"),
  description: z.string().optional(),
  isPublic: z.boolean(),
});

export type RotationFormValues = z.infer<typeof rotationSchema>;

interface RotationEditorProps {
  rotationId?: string;
  forkSourceId?: string;
}

function RotationEditorSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 md:auto-rows-min">
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-96 w-full md:col-span-2" />
    </div>
  );
}

function RotationEditorInner({
  rotationId,
  forkSourceId,
}: RotationEditorProps) {
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

  const form = useForm<RotationFormValues>({
    resolver: zodResolver(rotationSchema),
    defaultValues: {
      name: "",
      slug: "",
      class: "",
      spec: "",
      script: "",
      description: "",
      isPublic: false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (isEditMode && existingRotation) {
      form.reset({
        name: existingRotation.name,
        slug: existingRotation.slug,
        class: existingRotation.class,
        spec: existingRotation.spec,
        script: existingRotation.script,
        description: existingRotation.description ?? "",
        isPublic: existingRotation.isPublic,
      });
    }
  }, [isEditMode, existingRotation, form]);

  useEffect(() => {
    if (isForkMode && forkSource) {
      form.reset({
        name: `${forkSource.name} (Fork)`,
        slug: `${forkSource.slug}-fork`,
        class: forkSource.class,
        spec: forkSource.spec,
        script: forkSource.script,
        description: forkSource.description ?? "",
        isPublic: false,
      });
    }
  }, [isForkMode, forkSource, form]);

  const handleSave = async (values: RotationFormValues) => {
    if (!identity?.id) {
      return;
    }

    if (isEditMode && rotationId) {
      await updateRotation(rotationId, {
        name: values.name,
        slug: values.slug,
        class: values.class,
        spec: values.spec,
        script: values.script,
        description: values.description || null,
        isPublic: values.isPublic,
      });
    } else {
      const insertValues: RotationInsert = {
        userId: identity.id,
        name: values.name,
        slug: values.slug,
        class: values.class,
        spec: values.spec,
        script: values.script,
        description: values.description || null,
        isPublic: values.isPublic,
        forkedFromId: forkSourceId ?? null,
      };
      await createRotation(insertValues);
    }
  };

  const handleDelete = async () => {
    if (rotationId) {
      await deleteRotation(rotationId);
    }
  };

  if (authLoading || identityLoading) {
    return <RotationEditorSkeleton />;
  }

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

  if (isEditMode && isLoadingRotation) {
    return <RotationEditorSkeleton />;
  }

  if (isForkMode && isLoadingForkSource) {
    return <RotationEditorSkeleton />;
  }

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

  return (
    <form
      onSubmit={form.handleSubmit(handleSave)}
      className="grid gap-4 md:grid-cols-3 md:auto-rows-min"
    >
      <Controller
        name="name"
        control={form.control}
        render={({ field: nameField, fieldState: nameState }) => (
          <Controller
            name="slug"
            control={form.control}
            render={({ field: slugField, fieldState: slugState }) => (
              <Controller
                name="class"
                control={form.control}
                render={({ field: classField, fieldState: classState }) => (
                  <Controller
                    name="spec"
                    control={form.control}
                    render={({ field: specField, fieldState: specState }) => (
                      <Controller
                        name="description"
                        control={form.control}
                        render={({
                          field: descField,
                          fieldState: descState,
                        }) => (
                          <Controller
                            name="isPublic"
                            control={form.control}
                            render={({ field: publicField }) => (
                              <RotationMetadataCard
                                nameField={nameField}
                                nameInvalid={nameState.invalid}
                                nameError={nameState.error?.message}
                                slugField={slugField}
                                slugInvalid={slugState.invalid}
                                slugError={slugState.error?.message}
                                classField={classField}
                                classInvalid={classState.invalid}
                                classError={classState.error?.message}
                                specField={specField}
                                specInvalid={specState.invalid}
                                specError={specState.error?.message}
                                descriptionField={descField}
                                descriptionInvalid={descState.invalid}
                                descriptionError={descState.error?.message}
                                isPublicField={publicField}
                                isEditMode={isEditMode}
                                isMutating={isMutating}
                                onDelete={handleDelete}
                              />
                            )}
                          />
                        )}
                      />
                    )}
                  />
                )}
              />
            )}
          />
        )}
      />

      <Controller
        name="script"
        control={form.control}
        render={({ field, fieldState }) => (
          <RotationScriptCard
            scriptField={field}
            scriptInvalid={fieldState.invalid}
            scriptError={fieldState.error?.message}
            isMutating={isMutating}
            isFormValid={form.formState.isValid}
          />
        )}
      />
    </form>
  );
}

export function RotationEditor(props: RotationEditorProps) {
  return (
    <Suspense fallback={<RotationEditorSkeleton />}>
      <RotationEditorInner {...props} />
    </Suspense>
  );
}
