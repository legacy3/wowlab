import { UserProfilePage } from "@/components/users";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function UserProfile({ params }: Props) {
  const { handle } = await params;

  return <UserProfilePage handle={handle} />;
}
