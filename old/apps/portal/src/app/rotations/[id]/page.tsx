import { RotationDetail } from "@/components/rotations/detail";
import { notFound } from "next/navigation";

interface RotationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RotationPage({ params }: RotationPageProps) {
  const { id } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    notFound();
  }

  return <RotationDetail rotationId={id} />;
}
