import { SpellDetailPage } from "@/components/lab/inspector/spell";

interface SpellInspectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function SpellInspectorPage({
  params,
}: SpellInspectorPageProps) {
  const { id } = await params;

  return <SpellDetailPage spellId={id} />;
}
