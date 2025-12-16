import { PageLayout } from "@/components/page/page-layout";
import { SpellDetailPage } from "@/components/lab/inspector/spell-detail-page";

interface SpellInspectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function SpellInspectorPage({
  params,
}: SpellInspectorPageProps) {
  const { id } = await params;

  return (
    <PageLayout
      title="Spell Inspector"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab", href: "/lab" },
        { label: "Inspector", href: "/lab/inspector/search" },
        { label: `Spell #${id}` },
      ]}
    >
      <SpellDetailPage spellId={id} />
    </PageLayout>
  );
}
