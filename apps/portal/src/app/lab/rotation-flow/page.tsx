import { RotationFlowEditor } from "@/components/rotation-flow";

export default function RotationFlowPage() {
  return (
    <div className="container py-4">
      <div className="mb-3">
        <h1 className="text-lg font-bold">Rotation Flow Editor</h1>
        <p className="text-xs text-muted-foreground">
          Visual node-based rotation builder
        </p>
      </div>
      <RotationFlowEditor />
    </div>
  );
}
