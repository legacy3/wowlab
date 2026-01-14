import { capitalCase } from "change-case";

import { PageLayout } from "@/components/page";

interface Props {
  children: React.ReactNode;
  params: Promise<{ region: string; realm: string }>;
}

export default async function RealmLayout({ children, params }: Props) {
  const { region, realm } = await params;
  const realmName = capitalCase(realm);

  return (
    <PageLayout
      title={realmName}
      description={`Browse players from ${realmName} (${region.toUpperCase()}).`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Players", href: "/players" },
        { label: region.toUpperCase(), href: `/players/${region}` },
        { label: realmName },
      ]}
    >
      {children}
    </PageLayout>
  );
}
