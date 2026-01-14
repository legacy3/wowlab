import { ItemDetailPage } from "@/components/lab/inspector/item";

interface ItemInspectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemInspectorPage({
  params,
}: ItemInspectorPageProps) {
  const { id } = await params;

  return <ItemDetailPage itemId={id} />;
}
