import { TabsSkeleton, ProseSkeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <div className="flex flex-col gap-4">
      <TabsSkeleton tabCount={3} />
      <ProseSkeleton />
    </div>
  );
}
