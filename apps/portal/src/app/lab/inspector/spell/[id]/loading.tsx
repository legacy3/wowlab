import { PageLayout } from "@/components/page/page-layout";
import { SpellDetailSkeleton } from "@/components/lab/inspector/spell";

export default function SpellInspectorLoading() {
  return (
    <PageLayout
      title="Spell Inspector"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab", href: "/lab" },
        { label: "Inspector", href: "/lab/inspector/search" },
        { label: "Spell" },
      ]}
    >
      <SpellDetailSkeleton />
    </PageLayout>
  );
}
