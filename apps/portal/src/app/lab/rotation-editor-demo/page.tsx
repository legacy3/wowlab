import { VisualRotationEditor } from "@/components/rotation-editor";

export default function RotationEditorDemoPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Visual Rotation Editor</h1>
        <p className="text-muted-foreground">
          Drag-and-drop rotation builder prototype
        </p>
      </div>
      <VisualRotationEditor />
    </div>
  );
}
