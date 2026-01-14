import { NamespacePage } from "@/components/rotations/namespace-page";

interface UserProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { handle } = await params;

  return <NamespacePage namespace={handle} />;
}
