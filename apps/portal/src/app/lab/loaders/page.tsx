import { LoadersContent } from "@/components/lab/loaders/loaders-content";
import { PageHeader } from "@/components/page";

export const metadata = {
  title: "Loaders - WoW Lab",
  description: "Animated loading states showcase",
};

export default function LoadersPage() {
  return (
    <>
      <PageHeader
        title="Loaders"
        description="Animated loading states with Motion"
      />
      <LoadersContent />
    </>
  );
}
