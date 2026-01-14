import { PlayerContent } from "@/components/players";

interface Props {
  params: Promise<{ region: string; realm: string; name: string }>;
}

export default async function PlayerPage({ params }: Props) {
  const { region, realm, name } = await params;
  return <PlayerContent region={region} realm={realm} name={name} />;
}
