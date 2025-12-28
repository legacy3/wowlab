import { RegionContent } from "@/components/players";

interface Props {
  params: Promise<{ region: string }>;
}

export default async function RegionPage({ params }: Props) {
  const { region } = await params;
  return <RegionContent region={region} />;
}
