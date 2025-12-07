"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useGetIdentity, useUpdate } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Profile } from "@/lib/supabase/types";

// Default handles from generate_default_handle(): "user-{6 hex chars}" or "user-{6 hex chars}-{counter}"
const DEFAULT_HANDLE_PATTERN = /^user-[a-f0-9]{6}(-\d+)?$/;

const handleSchema = z.object({
  handle: z
    .string()
    .min(3, "Handle must be at least 3 characters")
    .max(20, "Handle must be less than 20 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Handle can only contain lowercase letters, numbers, and hyphens",
    )
    .refine((val) => !val.startsWith("-") && !val.endsWith("-"), {
      message: "Handle cannot start or end with a hyphen",
    })
    .refine((val) => !val.includes("--"), {
      message: "Handle cannot contain consecutive hyphens",
    }),
});

type HandleFormValues = z.infer<typeof handleSchema>;

function HandleInput({
  id,
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative flex-1">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        @
      </div>
      <Input id={id} className={`pl-7 ${className ?? ""}`} {...props} />
    </div>
  );
}

function HandleEditForm({
  currentHandle,
  onCancel,
  onSuccess,
}: {
  currentHandle: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { data: identity } = useGetIdentity<{ id: string }>();
  const { mutateAsync: updateProfile, mutation } = useUpdate<Profile>();
  
  const isUpdating = mutation.isPending;

  const form = useForm<HandleFormValues>({
    defaultValues: { handle: "" },
    mode: "onChange",
  });

  const validateHandle = (value: string): true | string => {
    if (!value) {
      return true;
    }

    const result = handleSchema.safeParse({ handle: value });
    if (!result.success) {
      return result.error.issues[0]?.message ?? "Invalid handle";
    }

    return true;
  };

  const onSubmit = async (values: HandleFormValues) => {
    if (!identity?.id) {
      return;
    }

    try {
      await updateProfile({
        resource: "user_profiles",
        id: identity.id,
        values: { handle: values.handle },
      });

      toast.success("Handle updated successfully");
      onSuccess();
    } catch (error) {
      form.setError("handle", {
        type: "manual",
        message:
          error instanceof Error ? error.message : "Failed to save handle",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="handle"
        control={form.control}
        rules={{ validate: validateHandle }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="handle">Handle</FieldLabel>
            <HandleInput
              {...field}
              id="handle"
              placeholder={currentHandle}
              autoFocus
              disabled={isUpdating}
              aria-invalid={fieldState.invalid}
              onChange={(e) => field.onChange(e.target.value.toLowerCase())}
            />
            <FieldDescription>
              3-20 characters, lowercase letters, numbers, and hyphens only
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isUpdating || !form.formState.isValid}
        >
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUpdating ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isUpdating}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function HandleDisplay({
  handle,
  canChange,
  onEdit,
}: {
  handle: string;
  canChange: boolean;
  onEdit: () => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor="handle-display">Handle</FieldLabel>
      <div className="flex gap-2">
        <HandleInput
          id="handle-display"
          value={handle}
          disabled
          className="opacity-60"
        />
        {canChange && (
          <Button variant="outline" onClick={onEdit}>
            Change
          </Button>
        )}
      </div>
      <FieldDescription>
        {canChange ? "Change from default handle" : "Handle cannot be changed"}
      </FieldDescription>
    </Field>
  );
}

function EmailDisplay({ email }: { email?: string }) {
  return (
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input
        id="email"
        type="email"
        value={email ?? ""}
        disabled
        className="opacity-60"
      />
      <FieldDescription>
        Email is managed by your authentication provider
      </FieldDescription>
    </Field>
  );
}

export function ProfileSettingsCard() {
  const router = useRouter();
  const { data: identity } = useGetIdentity<{
    id: string;
    handle: string;
    email?: string;
  }>();

  const [isEditing, setIsEditing] = useState(false);

  if (!identity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Please sign in to manage your profile settings
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handle = identity.handle || "user";
  const canChangeHandle = DEFAULT_HANDLE_PATTERN.test(handle);

  const handleEditSuccess = () => {
    setIsEditing(false);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your profile information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {isEditing ? (
            <HandleEditForm
              currentHandle={handle}
              onCancel={() => setIsEditing(false)}
              onSuccess={handleEditSuccess}
            />
          ) : (
            <>
              <HandleDisplay
                handle={handle}
                canChange={canChangeHandle}
                onEdit={() => setIsEditing(true)}
              />
              <EmailDisplay email={identity.email} />
            </>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
