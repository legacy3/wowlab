import { TreeSkeleton } from "@/components/ui/skeleton";

export default function DocsLoading() {
  return (
    <div className="max-w-xl">
      <TreeSkeleton itemCount={6} />
    </div>
  );
}
