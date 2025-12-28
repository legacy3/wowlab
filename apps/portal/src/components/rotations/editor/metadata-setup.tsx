"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toSlug } from "@/lib/slugify";
import { ArrowRight, Check, ChevronsUpDown, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { SpecPicker } from "@/components/ui/spec-picker";
import { SpecLabel } from "@/components/ui/spec-label";

interface RotationTemplate {
  id: string;
  name: string;
  description: string;
  script: string;
}

const EMPTY_TEMPLATE: RotationTemplate = {
  id: "empty",
  name: "Empty",
  description: "Start from scratch",
  script: `const cobraShot = yield* tryCast(rotation, playerId, SpellIds.COBRA_SHOT, targetId);
if (cobraShot.cast && cobraShot.consumedGCD) {
  return;
}
`,
};

// Templates per spec - can be expanded later
const SPEC_TEMPLATES: Record<number, RotationTemplate[]> = {
  //
};

// Default template for specs without specific templates
const getTemplatesForSpec = (specId: number): RotationTemplate[] => {
  return SPEC_TEMPLATES[specId] ?? [EMPTY_TEMPLATE];
};

const metadataSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  specId: z.number().int().positive("Spec is required"),
  description: z.string().optional(),
});

export type MetadataFormValues = z.infer<typeof metadataSchema>;

export interface MetadataSubmitValues extends MetadataFormValues {
  template: RotationTemplate;
}

interface MetadataSetupProps {
  defaultValues?: Partial<MetadataFormValues>;
  onSubmit: (values: MetadataSubmitValues) => void;
}

export function MetadataSetup({ defaultValues, onSubmit }: MetadataSetupProps) {
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<RotationTemplate>(EMPTY_TEMPLATE);

  const form = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      name: "",
      slug: "",
      specId: 0,
      description: "",
      ...defaultValues,
    },
    mode: "onChange",
  });

  const selectedSpecId = form.watch("specId");
  const availableTemplates = selectedSpecId
    ? getTemplatesForSpec(selectedSpecId)
    : [EMPTY_TEMPLATE];

  // Reset template when spec changes
  useEffect(() => {
    setSelectedTemplate(EMPTY_TEMPLATE);
  }, [selectedSpecId]);

  const watchedName = form.watch("name");
  useEffect(() => {
    if (watchedName && !form.formState.dirtyFields.slug) {
      form.setValue("slug", toSlug(watchedName).slice(0, 50), {
        shouldValidate: true,
      });
    }
  }, [watchedName, form]);

  const handleSubmit = (values: MetadataFormValues) => {
    onSubmit({
      ...values,
      template: selectedTemplate,
    });
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Create Rotation</h1>
        <p className="text-muted-foreground mt-1">
          Set up the basics, then start writing
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              placeholder="Shadow Raid ST"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <FieldError
                errors={[{ message: form.formState.errors.name.message }]}
              />
            )}
          </Field>

          <Field data-invalid={!!form.formState.errors.slug}>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <Input
              id="slug"
              placeholder="shadow-raid-st"
              {...form.register("slug")}
              onChange={(e) =>
                form.setValue(
                  "slug",
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  { shouldValidate: true, shouldDirty: true },
                )
              }
            />
            <FieldDescription>URL-friendly identifier</FieldDescription>
            {form.formState.errors.slug && (
              <FieldError
                errors={[{ message: form.formState.errors.slug.message }]}
              />
            )}
          </Field>

          <Field data-invalid={!!form.formState.errors.specId}>
            <FieldLabel>Spec</FieldLabel>
            {selectedSpecId > 0 && (
              <div className="mb-3 rounded-lg border px-3 py-2">
                <SpecLabel specId={selectedSpecId} size="sm" showIcon />
              </div>
            )}
            <SpecPicker
              onSpecSelect={(specId) =>
                form.setValue("specId", specId, { shouldValidate: true })
              }
            />
            {form.formState.errors.specId && (
              <FieldError
                errors={[{ message: form.formState.errors.specId.message }]}
              />
            )}
          </Field>

          {/* Template picker - only show after spec is selected */}
          {selectedSpecId > 0 && (
            <Field>
              <FieldLabel>Template</FieldLabel>
              <Popover
                open={templatePickerOpen}
                onOpenChange={setTemplatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={templatePickerOpen}
                    className="w-full justify-between h-auto py-3"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {selectedTemplate.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedTemplate.description}
                        </div>
                      </div>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search templates ..." />
                    <CommandList>
                      <CommandEmpty>No template found.</CommandEmpty>
                      <CommandGroup>
                        {availableTemplates.map((template) => (
                          <CommandItem
                            key={template.id}
                            value={template.id}
                            onSelect={() => {
                              setSelectedTemplate(template);
                              setTemplatePickerOpen(false);
                            }}
                            className="flex flex-col items-start gap-1 py-3"
                          >
                            <div className="flex w-full items-center">
                              <span className="font-medium">
                                {template.name}
                              </span>
                              {selectedTemplate.id === template.id && (
                                <Check className="ml-auto h-4 w-4 text-primary" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {template.description}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FieldDescription>
                Start with a template or from scratch
              </FieldDescription>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea
              id="description"
              placeholder="What's this rotation for?"
              rows={2}
              {...form.register("description")}
            />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isValid}
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Start Writing
        </Button>
      </form>
    </div>
  );
}
