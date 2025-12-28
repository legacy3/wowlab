"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toSlug } from "@/lib/slugify";
import { Save, Trash2 } from "lucide-react";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import type { Rotation } from "@/lib/supabase/types";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  description: z.string().optional(),
  isPublic: z.boolean(),
});

export type SettingsValues = z.infer<typeof settingsSchema>;

interface SettingsPanelProps {
  rotation: Rotation;
  onSave: (values: SettingsValues) => void;
  onDelete?: () => void;
  isDisabled: boolean;
}

export function SettingsPanel({
  rotation,
  onSave,
  onDelete,
  isDisabled,
}: SettingsPanelProps) {
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: rotation.name,
      slug: rotation.slug,
      description: rotation.description ?? "",
      isPublic: rotation.isPublic,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.name}>
          <FieldLabel htmlFor="settings-name">Name</FieldLabel>
          <Input
            id="settings-name"
            disabled={isDisabled}
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <FieldError
              errors={[{ message: form.formState.errors.name.message }]}
            />
          )}
        </Field>

        <Field data-invalid={!!form.formState.errors.slug}>
          <FieldLabel htmlFor="settings-slug">Slug</FieldLabel>
          <Input
            id="settings-slug"
            disabled={isDisabled}
            {...form.register("slug")}
            onChange={(e) => form.setValue("slug", toSlug(e.target.value))}
          />
          <FieldDescription>URL-friendly identifier</FieldDescription>
          {form.formState.errors.slug && (
            <FieldError
              errors={[{ message: form.formState.errors.slug.message }]}
            />
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="settings-description">Description</FieldLabel>
          <Textarea
            id="settings-description"
            rows={3}
            disabled={isDisabled}
            {...form.register("description")}
          />
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <div>
              <FieldLabel htmlFor="settings-public">Public</FieldLabel>
              <FieldDescription>
                Make this rotation visible to others
              </FieldDescription>
            </div>
            <Switch
              id="settings-public"
              checked={form.watch("isPublic")}
              onCheckedChange={(checked) => form.setValue("isPublic", checked)}
              disabled={isDisabled}
            />
          </div>
        </Field>
      </FieldGroup>

      <Button type="submit" className="w-full" disabled={isDisabled}>
        {isDisabled ? (
          <FlaskInlineLoader className="mr-2 h-4 w-4" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Changes
      </Button>

      {onDelete && (
        <>
          <Separator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={isDisabled}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Rotation
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete rotation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your rotation.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </form>
  );
}
