"use client";

import { useCallback } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CodeEditor, type MonacoInstance } from "@/components/ui/code-editor";
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
  const { onChange, onBlur, value } = scriptField;

  const handleBeforeMount = useCallback((monaco: MonacoInstance) => {
    monaco.typescript.typescriptDefaults.setCompilerOptions({ noLib: true });
  }, []);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
    },
    [onChange],
  );

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
      <CardContent className="space-y-2">
        <CodeEditor
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          beforeMount={handleBeforeMount}
          language="typescript"
          height={400}
          disabled={isMutating}
          className={scriptInvalid ? "border-destructive" : undefined}
        />
        {scriptInvalid && scriptError && (
          <p className="text-sm text-destructive">{scriptError}</p>
        )}
      </CardContent>
    </Card>
  );
}
