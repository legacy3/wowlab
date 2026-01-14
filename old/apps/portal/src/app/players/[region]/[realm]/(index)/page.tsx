import { RealmContent } from "@/components/players";

interface Props {
  params: Promise<{ region: string; realm: string }>;
}

export default async function RealmPage({ params }: Props) {
  const { region, realm } = await params;
  return <RealmContent region={region} realm={realm} />;
}
