import { capitalCase } from "change-case";

import { PageLayout } from "@/components/page";

interface Props {
  children: React.ReactNode;
  params: Promise<{ region: string; realm: string; name: string }>;
}

export default async function PlayerLayout({ children, params }: Props) {
  const { region, realm, name } = await params;
  const realmName = capitalCase(realm);
  const playerName = capitalCase(name);

  return (
    <PageLayout
      title={playerName}
      description={`${playerName} on ${realmName} (${region.toUpperCase()})`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Players", href: "/players" },
        { label: region.toUpperCase(), href: `/players/${region}` },
        { label: realmName, href: `/players/${region}/${realm}` },
        { label: playerName },
      ]}
    >
      {children}
    </PageLayout>
  );
}
