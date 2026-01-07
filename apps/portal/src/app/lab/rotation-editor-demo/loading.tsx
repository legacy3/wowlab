import { VisualRotationEditorSkeleton } from "@/components/rotation-editor";

export default function RotationEditorDemoLoading() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
      </div>
      <VisualRotationEditorSkeleton />
    </div>
  );
}
