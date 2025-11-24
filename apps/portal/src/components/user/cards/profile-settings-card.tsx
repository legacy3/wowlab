"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAtom, useSetAtom } from "jotai";
import { Controller, useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod"; // Temporarily disabled
import { z } from "zod";
import {
  currentProfileAtom,
  profileSettingsAtom,
  checkReservedHandleAtom,
  checkHandleAvailabilityAtom,
  canChangeHandleAtom,
  sessionAtom,
} from "@/atoms";
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

export function ProfileSettingsCard() {
  const router = useRouter();
  const [profile] = useAtom(currentProfileAtom);
  const [, updateProfile] = useAtom(profileSettingsAtom);
  const [, checkReserved] = useAtom(checkReservedHandleAtom);
  const [, checkTaken] = useAtom(checkHandleAvailabilityAtom);
  const [canChangeHandle] = useAtom(canChangeHandleAtom);
  const refreshSession = useSetAtom(sessionAtom);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    // Temporarily disabled - zod version conflict
    // resolver: zodResolver(handleSchema),
    defaultValues: { handle: "" },
    mode: "onChange",
  });

  const validateHandle = async (value: string) => {
    if (!value) {
      return true;
    }

    const isReserved = await checkReserved(value);
    if (isReserved) {
      return "This handle is reserved";
    }

    const isTaken = await checkTaken(value);
    if (isTaken) {
      return "This handle is already taken";
    }

    return true;
  };

  const onSubmit = async (values: z.infer<typeof handleSchema>) => {
    const validation = await validateHandle(values.handle);
    if (validation !== true) {
      form.setError("handle", { type: "manual", message: validation });
      return;
    }

    try {
      await updateProfile({ handle: values.handle });
      refreshSession();
      toast.success("Handle updated successfully");
      router.push("/user/settings");
    } catch (error) {
      form.setError("handle", {
        type: "manual",
        message:
          error instanceof Error ? error.message : "Failed to save handle",
      });
    }
  };

  if (!profile) {
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
            <form
              id="handle-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <Controller
                name="handle"
                control={form.control}
                rules={{ validate: validateHandle }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="handle">Handle</FieldLabel>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        @
                      </div>
                      <Input
                        {...field}
                        id="handle"
                        placeholder={profile.handle}
                        className="pl-7"
                        autoFocus
                        disabled={form.formState.isSubmitting}
                        aria-invalid={fieldState.invalid}
                        onChange={(e) =>
                          field.onChange(e.target.value.toLowerCase())
                        }
                      />
                    </div>
                    <FieldDescription>
                      3-20 characters, lowercase letters, numbers, and hyphens
                      only
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
                  disabled={
                    form.formState.isSubmitting || !form.formState.isValid
                  }
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset();
                  }}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="handle-display">Handle</FieldLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      @
                    </div>
                    <Input
                      id="handle-display"
                      value={profile.handle}
                      disabled
                      className="pl-7 opacity-60"
                    />
                  </div>
                  {canChangeHandle && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Change
                    </Button>
                  )}
                </div>
                <FieldDescription>
                  {canChangeHandle
                    ? "Change from default handle"
                    : "Handle cannot be changed"}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={profile.email ?? ""}
                  disabled
                  className="opacity-60"
                />
                <FieldDescription>
                  Email is managed by your authentication provider
                </FieldDescription>
              </Field>
            </>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
