"use client";

import { Suspense } from "react";
import { useAtom } from "jotai";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import { editorCardOrderAtom, type EditorCardId } from "@/atoms/editor";
import {
  RotationScriptCard,
  TemplatesCard,
  SyntaxReferenceCard,
  ValidationCard,
} from "./cards";

const components: DashboardConfig<EditorCardId> = {
  "rotation-script": {
    Component: RotationScriptCard,
    className: "md:col-span-2",
  },
  templates: {
    Component: TemplatesCard,
  },
  "syntax-reference": {
    Component: SyntaxReferenceCard,
  },
  validation: {
    Component: ValidationCard,
  },
};

function EditorContentInner() {
  const [order, setOrder] = useAtom(editorCardOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4 md:grid-cols-3 md:auto-rows-min"
    />
  );
}

function EditorContentSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 md:auto-rows-min">
      <Skeleton className="h-96 w-full md:col-span-2" />
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

type EditorContentProps = {
  rotationId?: string;
  sourceId?: string;
};

export function EditorContent(_props: EditorContentProps) {
  return (
    <Suspense fallback={<EditorContentSkeleton />}>
      <EditorContentInner />
    </Suspense>
  );
}
