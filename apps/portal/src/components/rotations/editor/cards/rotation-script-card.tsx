"use client";

import type { ControllerRenderProps } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import type { RotationFormValues } from "../rotation-editor";

interface RotationScriptCardProps {
  scriptField: ControllerRenderProps<RotationFormValues, "script">;
  scriptInvalid: boolean;
  scriptError?: string;
  isMutating: boolean;
  isFormValid: boolean;
}

export function RotationScriptCard({
  scriptField,
  scriptInvalid,
  scriptError,
  isMutating,
  isFormValid,
}: RotationScriptCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rotation Script</CardTitle>
            <CardDescription>
              Edit your custom rotation priority
            </CardDescription>
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isMutating || !isFormValid}
          >
            {isMutating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isMutating ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Enter your rotation script..."
          className="font-mono text-sm min-h-[400px] resize-y"
          disabled={isMutating}
          aria-invalid={scriptInvalid}
          {...scriptField}
        />
        {scriptInvalid && scriptError && (
          <p className="text-sm text-destructive mt-2">{scriptError}</p>
        )}
      </CardContent>
    </Card>
  );
}
