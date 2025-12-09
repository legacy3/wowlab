"use client";

import type { ControllerRenderProps } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import type { RotationFormValues } from "../rotation-editor";

const WOW_CLASSES = [
  "Druid",
  "Hunter",
  "Mage",
  "Paladin",
  "Priest",
  "Rogue",
  "Shaman",
  "Warlock",
  "Warrior",
] as const;

const CLASS_SPECS: Record<string, string[]> = {
  Druid: ["Balance", "Feral", "Restoration"],
  Hunter: ["Beast Mastery", "Marksmanship", "Survival"],
  Mage: ["Arcane", "Fire", "Frost"],
  Paladin: ["Holy", "Protection", "Retribution"],
  Priest: ["Discipline", "Holy", "Shadow"],
  Rogue: ["Assassination", "Combat", "Subtlety"],
  Shaman: ["Elemental", "Enhancement", "Restoration"],
  Warlock: ["Affliction", "Demonology", "Destruction"],
  Warrior: ["Arms", "Fury", "Protection"],
};

interface RotationMetadataCardProps {
  nameField: ControllerRenderProps<RotationFormValues, "name">;
  nameInvalid: boolean;
  nameError?: string;
  slugField: ControllerRenderProps<RotationFormValues, "slug">;
  slugInvalid: boolean;
  slugError?: string;
  classField: ControllerRenderProps<RotationFormValues, "class">;
  classInvalid: boolean;
  classError?: string;
  specField: ControllerRenderProps<RotationFormValues, "spec">;
  specInvalid: boolean;
  specError?: string;
  descriptionField: ControllerRenderProps<RotationFormValues, "description">;
  descriptionInvalid: boolean;
  descriptionError?: string;
  isPublicField: ControllerRenderProps<RotationFormValues, "isPublic">;
  isEditMode: boolean;
  isMutating: boolean;
  onDelete: () => void;
}

export function RotationMetadataCard({
  nameField,
  nameInvalid,
  nameError,
  slugField,
  slugInvalid,
  slugError,
  classField,
  classInvalid,
  classError,
  specField,
  specInvalid,
  specError,
  descriptionField,
  descriptionInvalid,
  descriptionError,
  isPublicField,
  isEditMode,
  isMutating,
  onDelete,
}: RotationMetadataCardProps) {
  const selectedClass = classField.value;
  const availableSpecs = selectedClass
    ? (CLASS_SPECS[selectedClass] ?? [])
    : [];

  return (
    <Card className="md:row-span-2">
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Rotation" : "New Rotation"}</CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update your rotation details"
            : "Configure your rotation metadata"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field data-invalid={nameInvalid}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              placeholder="My Shadow Rotation"
              disabled={isMutating}
              aria-invalid={nameInvalid}
              {...nameField}
            />
            <FieldDescription>
              A descriptive name for your rotation
            </FieldDescription>
            {nameInvalid && <FieldError errors={[{ message: nameError }]} />}
          </Field>

          <Field data-invalid={slugInvalid}>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <Input
              id="slug"
              placeholder="my-shadow-rotation"
              disabled={isMutating}
              aria-invalid={slugInvalid}
              {...slugField}
              onChange={(e) =>
                slugField.onChange(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                )
              }
            />
            <FieldDescription>
              URL-friendly identifier (lowercase, hyphens only)
            </FieldDescription>
            {slugInvalid && <FieldError errors={[{ message: slugError }]} />}
          </Field>

          <Field data-invalid={classInvalid}>
            <FieldLabel htmlFor="class">Class</FieldLabel>
            <Select
              value={classField.value}
              onValueChange={(value) => {
                classField.onChange(value);
                specField.onChange("");
              }}
              disabled={isMutating}
            >
              <SelectTrigger id="class" aria-invalid={classInvalid}>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {WOW_CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {classInvalid && <FieldError errors={[{ message: classError }]} />}
          </Field>

          <Field data-invalid={specInvalid}>
            <FieldLabel htmlFor="spec">Specialization</FieldLabel>
            <Select
              value={specField.value}
              onValueChange={specField.onChange}
              disabled={isMutating || !selectedClass}
            >
              <SelectTrigger id="spec" aria-invalid={specInvalid}>
                <SelectValue
                  placeholder={
                    selectedClass ? "Select a spec" : "Select a class first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableSpecs.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {specInvalid && <FieldError errors={[{ message: specError }]} />}
          </Field>

          <Field data-invalid={descriptionInvalid}>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              placeholder="Describe your rotation..."
              rows={3}
              disabled={isMutating}
              aria-invalid={descriptionInvalid}
              {...descriptionField}
            />
            <FieldDescription>Optional description</FieldDescription>
            {descriptionInvalid && (
              <FieldError errors={[{ message: descriptionError }]} />
            )}
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <div>
                <FieldLabel htmlFor="isPublic">Public</FieldLabel>
                <FieldDescription>
                  Make this rotation visible to others
                </FieldDescription>
              </div>
              <Switch
                id="isPublic"
                checked={isPublicField.value}
                onCheckedChange={isPublicField.onChange}
                disabled={isMutating}
              />
            </div>
          </Field>

          {isEditMode && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={isMutating}
                >
                  {isMutating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
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
                  <AlertDialogAction onClick={onDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
