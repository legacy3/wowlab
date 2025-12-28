import { NodeDetailPage } from "@/components/nodes";

interface NodeDetailPageProps {
  params: Promise<{ nodeId: string }>;
}

export default async function NodeSettingsPage({
  params,
}: NodeDetailPageProps) {
  const { nodeId } = await params;

  return <NodeDetailPage nodeId={nodeId} />;
}
